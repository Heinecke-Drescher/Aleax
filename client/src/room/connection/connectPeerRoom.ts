import { joinRoom, type Room } from "trystero";
import { IndexeddbPersistence } from "y-indexeddb";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import * as Y from "yjs";
import { notifyError } from "../../notifyError";
import type { RoomConnection, RoomEvents } from "./connectRoom";
import { parseTurnServers } from "./turnServers";

// Public relays are shared by many apps, so the id has to be unique to Aleax.
const APP_ID = "github.com/Heinecke-Drescher/Aleax";
export const ALONE_SYNC_MS = 3000;
export const ANSWER_SYNC_MS = 10_000;
// Read when the app loads, so a wrong build fails at once.
const TURN_SERVERS = parseTurnServers(import.meta.env.VITE_TURN_ICE_SERVERS);

export interface PeerChannel {
  send: (data: Uint8Array, peerId?: string) => void;
  onMessage: (handler: (data: Uint8Array, peerId: string) => void) => void;
}

export interface Peers {
  channel: (name: string) => PeerChannel;
  onPeerJoin: (handler: (peerId: string) => void) => void;
  onPeerLeave: (handler: (peerId: string) => void) => void;
}

interface PeerOrigin {
  peerId: string;
}

export function connectPeerRoom(
  roomId: string,
  doc: Y.Doc,
  events: RoomEvents,
): RoomConnection {
  const awareness = new Awareness(doc);
  // Without a server every browser keeps its own copy of the room.
  const savedCopy = new IndexeddbPersistence(`aleax-room-${roomId}`, doc);
  let hasLeft = false;
  let hasJoined = false;
  let canSave = true;
  let leavePeers = () => {};
  function meetPeers() {
    if (hasLeft || hasJoined) return;
    hasJoined = true;
    leavePeers = joinPeers(roomId, doc, awareness, events, () => hasLeft);
  }
  // Meeting the others only after loading the copy lets the state vectors
  // tell them what this browser already has.
  void savedCopy.whenSynced.then(meetPeers);
  // `whenSynced` never settles when the database cannot open, so the room
  // goes on without a copy in this browser.
  savedCopy._db.catch((error: unknown) => {
    canSave = false;
    if (hasLeft) return;
    notifyError("This browser cannot save the room", error);
    meetPeers();
  });
  return {
    awareness,
    disconnect: () => {
      hasLeft = true;
      leavePeers();
      awareness.destroy();
      // Closing waits for the database, which failed then.
      if (canSave) void savedCopy.destroy();
    },
  };
}

function joinPeers(
  roomId: string,
  doc: Y.Doc,
  awareness: Awareness,
  { onSynced, onConnectionChange }: RoomEvents,
  hasLeft: () => boolean,
) {
  // The room id is the secret of the room link, so the relays only see
  // offers that nobody without the link can read.
  const room = joinRoom(
    {
      appId: APP_ID,
      password: roomId,
      turnConfig: TURN_SERVERS,
    },
    roomId,
  );
  const unlink = linkPeers(doc, awareness, trysteroPeers(room), () =>
    onSynced(true),
  );
  room.ready.then(
    () => !hasLeft() && onConnectionChange("connected"),
    () => !hasLeft() && onConnectionChange("disconnected"),
  );
  return () => {
    unlink();
    void room.leave();
  };
}

function trysteroPeers(room: Room): Peers {
  return {
    channel: (name) => {
      const action = room.makeAction<Uint8Array>(name);
      return {
        send: (data, peerId) => {
          action
            .send(data, { target: peerId ?? null })
            .catch(ignorePeerThatLeft);
        },
        onMessage: (handler) => {
          action.onMessage((data, { peerId }) => {
            if (!(data instanceof Uint8Array)) {
              throw new Error(`Peer ${peerId} sent no binary data on ${name}`);
            }
            handler(data, peerId);
          });
        },
      };
    },
    onPeerJoin: (handler) => {
      room.onPeerJoin(({ peerId }) => handler(peerId));
    },
    onPeerLeave: (handler) => {
      room.onPeerLeave(({ peerId }) => handler(peerId));
    },
  };
}

function ignorePeerThatLeft(error: unknown) {
  if (
    error instanceof Error &&
    "kind" in error &&
    error.kind === "disconnected"
  )
    return;
  throw error;
}

// Every player is connected to every other one, so each sends only its own
// changes. A newcomer sends its state vector and gets back what it misses.
export function linkPeers(
  doc: Y.Doc,
  awareness: Awareness,
  peers: Peers,
  onSynced: () => void,
) {
  const stateVectors = peers.channel("state-vector");
  const missing = peers.channel("missing");
  const updates = peers.channel("update");
  const presence = peers.channel("awareness");
  const clientsOfPeer = new Map<string, Set<number>>();
  let isSynced = false;
  let syncTimer: ReturnType<typeof setTimeout> | undefined;

  function markSynced() {
    if (isSynced) return;
    isSynced = true;
    clearTimeout(syncTimer);
    onSynced();
  }

  // Nobody can tell a newcomer that it is alone or that an answer will never
  // come, so after a while it counts its own copy as the room.
  function syncAfter(ms: number) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(markSynced, ms);
  }

  peers.onPeerJoin((peerId) => {
    stateVectors.send(Y.encodeStateVector(doc), peerId);
    presence.send(
      encodeAwarenessUpdate(awareness, [awareness.clientID]),
      peerId,
    );
    if (!isSynced) syncAfter(ANSWER_SYNC_MS);
  });

  peers.onPeerLeave((peerId) => {
    const clients = clientsOfPeer.get(peerId);
    clientsOfPeer.delete(peerId);
    if (clients) removeAwarenessStates(awareness, [...clients], peers);
  });

  stateVectors.onMessage((stateVector, peerId) => {
    missing.send(Y.encodeStateAsUpdate(doc, stateVector), peerId);
  });
  missing.onMessage((update) => {
    Y.applyUpdate(doc, update, peers);
    markSynced();
  });
  updates.onMessage((update) => Y.applyUpdate(doc, update, peers));
  presence.onMessage((update, peerId) => {
    const origin: PeerOrigin = { peerId };
    applyAwarenessUpdate(awareness, update, origin);
  });

  function sendOwnUpdate(update: Uint8Array, origin: unknown) {
    if (origin !== peers) updates.send(update);
  }

  function handlePresence(
    {
      added,
      updated,
      removed,
    }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) {
    if (origin === "local") {
      presence.send(
        encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed]),
      );
      return;
    }
    if (!isPeerOrigin(origin)) return;
    const clients = clientsOfPeer.get(origin.peerId) ?? new Set();
    for (const clientId of [...added, ...updated]) clients.add(clientId);
    clientsOfPeer.set(origin.peerId, clients);
  }

  doc.on("update", sendOwnUpdate);
  awareness.on("update", handlePresence);
  syncAfter(ALONE_SYNC_MS);

  return () => {
    clearTimeout(syncTimer);
    doc.off("update", sendOwnUpdate);
    awareness.off("update", handlePresence);
  };
}

function isPeerOrigin(origin: unknown): origin is PeerOrigin {
  return typeof origin === "object" && origin !== null && "peerId" in origin;
}
