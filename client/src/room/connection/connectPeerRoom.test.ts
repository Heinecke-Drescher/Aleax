import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { ROOM_HISTORY } from "../roomStore";
import {
  ALONE_SYNC_MS,
  ANSWER_SYNC_MS,
  BLOCKED_PEER_WARNING_MS,
  connectPeerRoom,
  linkPeers,
  type PeerChannel,
  type Peers,
} from "./connectPeerRoom";
import { CONNECTION_CHECK_MS } from "./connectionWatch";

const trystero = vi.hoisted(() => ({
  sockets: {} as Record<string, { readyState: number }>,
  peers: {} as Record<string, object>,
  onError: (_error: object) => {},
  leave: () => Promise.resolve(),
}));
const showNotification = vi.hoisted(() => vi.fn());

vi.mock("trystero", () => ({
  getRelaySockets: () => trystero.sockets,
  joinRoom: () => ({
    makeAction: () => ({
      send: () => Promise.resolve(),
      onMessage: () => {},
    }),
    onPeerJoin: () => {},
    onPeerLeave: () => {},
    onError: (handler: (error: object) => void) => {
      trystero.onError = handler;
      return () => {
        trystero.onError = () => {};
      };
    },
    getPeers: () => trystero.peers,
    leave: () => trystero.leave(),
  }),
}));

vi.mock("y-indexeddb", () => ({
  IndexeddbPersistence: class {
    whenSynced = Promise.resolve();
    _db = Promise.resolve();
    destroy = () => Promise.resolve();
  },
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: showNotification },
}));

type Handler = (data: Uint8Array, peerId: string) => void;

interface Member {
  id: string;
  handlers: Map<string, Handler[]>;
  joinHandlers: ((peerId: string) => void)[];
  leaveHandlers: ((peerId: string) => void)[];
}

// Delivers every message at once between connected members.
function createNetwork() {
  const members = new Map<string, Member>();
  const links = new Set<string>();
  const isLinked = (a: string, b: string) => links.has([a, b].sort().join());

  function peersOf(id: string): Peers {
    const member: Member = {
      id,
      handlers: new Map(),
      joinHandlers: [],
      leaveHandlers: [],
    };
    members.set(id, member);
    return {
      channel: (name): PeerChannel => ({
        send: (data, target) => {
          for (const other of members.values()) {
            if (!isLinked(id, other.id)) continue;
            if (target !== undefined && other.id !== target) continue;
            for (const handler of other.handlers.get(name) ?? [])
              handler(data, id);
          }
        },
        onMessage: (handler) => {
          member.handlers.set(name, [
            ...(member.handlers.get(name) ?? []),
            handler,
          ]);
        },
      }),
      onPeerJoin: (handler) => member.joinHandlers.push(handler),
      onPeerLeave: (handler) => member.leaveHandlers.push(handler),
    };
  }

  function connect(a: string, b: string) {
    const first = members.get(a);
    const second = members.get(b);
    if (!first || !second) throw new Error("Unknown member");
    links.add([a, b].sort().join());
    for (const handler of first.joinHandlers) handler(b);
    for (const handler of second.joinHandlers) handler(a);
  }

  function disconnect(a: string, b: string) {
    const first = members.get(a);
    const second = members.get(b);
    if (!first || !second) throw new Error("Unknown member");
    links.delete([a, b].sort().join());
    for (const handler of first.leaveHandlers) handler(b);
    for (const handler of second.leaveHandlers) handler(a);
  }

  function leave(id: string) {
    members.delete(id);
    for (const other of members.values()) {
      if (!isLinked(id, other.id)) continue;
      links.delete([id, other.id].sort().join());
      for (const handler of other.leaveHandlers) handler(id);
    }
  }

  return { peersOf, connect, disconnect, leave };
}

function createPlayer(network: ReturnType<typeof createNetwork>, id: string) {
  const doc = new Y.Doc();
  const awareness = new Awareness(doc);
  const onSynced = vi.fn();
  const unlink = linkPeers(doc, awareness, network.peersOf(id), onSynced);
  return { doc, awareness, onSynced, unlink };
}

describe("linkPeers", () => {
  let network: ReturnType<typeof createNetwork>;
  const players: ReturnType<typeof createPlayer>[] = [];

  function join(id: string) {
    const player = createPlayer(network, id);
    players.push(player);
    return player;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    network = createNetwork();
  });

  afterEach(() => {
    for (const player of players.splice(0)) {
      player.unlink();
      player.awareness.destroy();
    }
    vi.useRealTimers();
  });

  it("gives a newcomer what the others already have", () => {
    const host = join("host");
    host.doc.getMap("tokens").set("t1", { name: "Mira" });
    const guest = join("guest");

    network.connect("host", "guest");

    expect(guest.doc.getMap("tokens").get("t1")).toEqual({ name: "Mira" });
    expect(guest.onSynced).toHaveBeenCalledOnce();
  });

  it("merges what both had before they met", () => {
    const host = join("host");
    const guest = join("guest");
    host.doc.getMap("tokens").set("t1", "host");
    guest.doc.getMap("tokens").set("t2", "guest");

    network.connect("host", "guest");

    for (const player of [host, guest]) {
      expect(player.doc.getMap("tokens").toJSON()).toEqual({
        t1: "host",
        t2: "guest",
      });
    }
  });

  it("sends later changes both ways", () => {
    const host = join("host");
    const guest = join("guest");
    network.connect("host", "guest");

    host.doc.getMap("tokens").set("t1", "host");
    guest.doc.getArray("rolls").push([6]);

    expect(guest.doc.getMap("tokens").get("t1")).toBe("host");
    expect(host.doc.getArray("rolls").toArray()).toEqual([6]);
  });

  it("counts a player alone as synced after a moment", () => {
    const host = join("host");

    vi.advanceTimersByTime(ALONE_SYNC_MS - 1);
    expect(host.onSynced).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(host.onSynced).toHaveBeenCalledOnce();
  });

  it("gives a peer that never answers a longer while", () => {
    const guest = join("guest");
    network.peersOf("silent");
    network.connect("guest", "silent");

    vi.advanceTimersByTime(ANSWER_SYNC_MS - 1);
    expect(guest.onSynced).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(guest.onSynced).toHaveBeenCalledOnce();
  });

  it("shares the presence and drops it when a peer leaves", () => {
    const host = join("host");
    const guest = join("guest");
    host.awareness.setLocalState({ name: "Mira" });
    network.connect("host", "guest");

    expect(guest.awareness.getStates().get(host.awareness.clientID)).toEqual({
      name: "Mira",
    });

    host.awareness.setLocalState({ name: "Mira", cursor: { x: 1, y: 2 } });
    expect(guest.awareness.getStates().get(host.awareness.clientID)).toEqual({
      name: "Mira",
      cursor: { x: 1, y: 2 },
    });

    network.leave("host");
    expect(guest.awareness.getStates().has(host.awareness.clientID)).toBe(
      false,
    );
  });

  it("marks what a newcomer catches up on as room history", () => {
    const host = join("host");
    host.doc.getMap("tokens").set("t1", "earlier");
    const guest = join("guest");
    const origins: unknown[] = [];
    guest.doc.on("afterTransaction", (transaction) =>
      origins.push(transaction.origin),
    );

    network.connect("host", "guest");
    host.doc.getMap("tokens").set("t2", "now");

    expect(origins[0]).toBe(ROOM_HISTORY);
    expect(origins.slice(1)).not.toContain(ROOM_HISTORY);
    expect(guest.doc.getMap("tokens").get("t2")).toBe("now");
  });

  it("passes on only its own changes, not what it caught up on", () => {
    const host = join("host");
    host.doc.getMap("tokens").set("t1", "host");
    join("guest");
    const other = join("other");
    network.connect("guest", "other");

    network.connect("host", "guest");

    expect(other.doc.getMap("tokens").has("t1")).toBe(false);
  });

  it("shows a peer again that comes back after a short drop", () => {
    const host = join("host");
    const guest = join("guest");
    host.awareness.setLocalState({ name: "Mira" });
    network.connect("host", "guest");

    network.disconnect("host", "guest");
    expect(guest.awareness.getStates().has(host.awareness.clientID)).toBe(
      false,
    );
    network.connect("host", "guest");

    expect(guest.awareness.getStates().get(host.awareness.clientID)).toEqual({
      name: "Mira",
    });
  });

  it("ignores what arrives after unlinking", () => {
    const host = join("host");
    const guest = join("guest");
    guest.unlink();

    host.doc.getMap("tokens").set("t1", "host");
    network.connect("host", "guest");
    vi.advanceTimersByTime(ANSWER_SYNC_MS);

    expect(guest.doc.getMap("tokens").has("t1")).toBe(false);
    expect(guest.onSynced).not.toHaveBeenCalled();
  });

  it("stops sending after unlinking", () => {
    const host = join("host");
    const guest = join("guest");
    network.connect("host", "guest");

    host.unlink();
    host.doc.getMap("tokens").set("t1", "host");

    expect(guest.doc.getMap("tokens").has("t1")).toBe(false);
  });
});

describe("connectPeerRoom", () => {
  const events = {
    onSynced: vi.fn(),
    onConnectionChange: vi.fn(),
    onRoomFull: vi.fn(),
  };

  function peerConnectFailed(peerId: string, turnConfigured = false) {
    trystero.onError({ code: "peer-connect-failed", peerId, turnConfigured });
  }

  async function enter() {
    const connection = connectPeerRoom("abcdefghijkl", new Y.Doc(), events);
    // The saved copy loads before the others are met.
    await vi.advanceTimersByTimeAsync(0);
    return connection;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    trystero.sockets = {};
    trystero.peers = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("reports the connection and nothing after leaving", async () => {
    const connection = await enter();
    trystero.sockets = { relay: { readyState: WebSocket.OPEN } };

    await vi.advanceTimersByTimeAsync(CONNECTION_CHECK_MS);
    expect(events.onConnectionChange).toHaveBeenLastCalledWith("connected");

    connection.disconnect();
    trystero.sockets = {};
    peerConnectFailed("peer");
    await vi.advanceTimersByTimeAsync(BLOCKED_PEER_WARNING_MS);

    expect(events.onConnectionChange).toHaveBeenCalledOnce();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("warns once of players still missing after failed attempts", async () => {
    const connection = await enter();
    peerConnectFailed("first");
    peerConnectFailed("second");

    await vi.advanceTimersByTimeAsync(BLOCKED_PEER_WARNING_MS);

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: "On mobile data, try Wi-Fi." }),
    );
    connection.disconnect();
  });

  it("does not warn of a player that got through after all", async () => {
    const connection = await enter();
    peerConnectFailed("peer", true);
    trystero.peers = { peer: {} };

    await vi.advanceTimersByTimeAsync(BLOCKED_PEER_WARNING_MS);

    expect(showNotification).not.toHaveBeenCalled();
    connection.disconnect();
  });
});
