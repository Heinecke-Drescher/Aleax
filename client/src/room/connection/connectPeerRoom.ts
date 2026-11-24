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
  const canSave = savedCopy._db.then(
    () => true,
    (error: unknown) => {
      if (!hasLeft) {
        notifyError("This browser cannot save the room", error);
        meetPeers();
      }
      return false;
    },
  );
  return {
    awareness,
    disconnect: () => {
      hasLeft = true;
      leavePeers();
      awareness.destroy();
      // Closing waits for the database, so only one that opened can close.
      void canSave.then((isOpen) => {
        if (isOpen) return savedCopy.destroy();
      });
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
  let isLinked = true;
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

  // Messages can still come in while the room is being left.
  function whileLinked<T extends unknown[]>(handler: (...args: T) => void) {
    return (...args: T) => {
      if (isLinked) handler(...args);
    };
  }

  peers.onPeerJoin(
    whileLinked((peerId: string) => {
      stateVectors.send(Y.encodeStateVector(doc), peerId);
      presence.send(
        encodeAwarenessUpdate(awareness, [awareness.clientID]),
        peerId,
      );
      if (!isSynced) syncAfter(ANSWER_SYNC_MS);
    }),
  );

  peers.onPeerLeave(
    whileLinked((peerId: string) => {
      const clients = [...(clientsOfPeer.get(peerId) ?? [])];
      clientsOfPeer.delete(peerId);
      removeAwarenessStates(awareness, clients, peers);
      // A peer that comes back sends its presence with the same clock, which
      // only counts as new once the old one is forgotten.
      for (const clientId of clients) awareness.meta.delete(clientId);
    }),
  );

  stateVectors.onMessage(
    whileLinked((stateVector: Uint8Array, peerId: string) => {
      missing.send(Y.encodeStateAsUpdate(doc, stateVector), peerId);
    }),
  );
  missing.onMessage(
    whileLinked((update: Uint8Array) => {
      Y.applyUpdate(doc, update, peers);
      markSynced();
    }),
  );
  updates.onMessage(
    whileLinked((update: Uint8Array) => Y.applyUpdate(doc, update, peers)),
  );
  presence.onMessage(
    whileLinked((update: Uint8Array, peerId: string) => {
      const origin: PeerOrigin = { peerId };
      applyAwarenessUpdate(awareness, update, origin);
    }),
  );

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
    isLinked = false;
    clearTimeout(syncTimer);
    doc.off("update", sendOwnUpdate);
    awareness.off("update", handlePresence);
  };
}

function isPeerOrigin(origin: unknown): origin is PeerOrigin {
  return typeof origin === "object" && origin !== null && "peerId" in origin;
}
