import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import {
  ALONE_SYNC_MS,
  ANSWER_SYNC_MS,
  linkPeers,
  type PeerChannel,
  type Peers,
} from "./connectPeerRoom";

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

  function leave(id: string) {
    members.delete(id);
    for (const other of members.values()) {
      if (!isLinked(id, other.id)) continue;
      links.delete([id, other.id].sort().join());
      for (const handler of other.leaveHandlers) handler(id);
    }
  }

  return { peersOf, connect, leave };
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

  it("stops sending after unlinking", () => {
    const host = join("host");
    const guest = join("guest");
    network.connect("host", "guest");

    host.unlink();
    host.doc.getMap("tokens").set("t1", "host");

    expect(guest.doc.getMap("tokens").has("t1")).toBe(false);
  });
});
