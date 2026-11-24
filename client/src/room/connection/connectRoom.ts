import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import { connectPeerRoom } from "./connectPeerRoom";
import { connectServerRoom } from "./connectServerRoom";

export type { Awareness };
export type ConnectionState = "connecting" | "connected" | "disconnected";

export interface RoomEvents {
  onSynced: (isSynced: boolean) => void;
  onConnectionChange: (state: ConnectionState) => void;
  onRoomFull: () => void;
}

export interface RoomConnection {
  awareness: Awareness;
  disconnect: () => void;
}

// The build decides the way for every room: `vite --mode p2p` connects the
// players directly, every other mode through the sync server.
export const IS_PEER_TO_PEER = import.meta.env.MODE === "p2p";

export const connectRoom: (
  roomId: string,
  doc: Y.Doc,
  events: RoomEvents,
) => RoomConnection = IS_PEER_TO_PEER ? connectPeerRoom : connectServerRoom;
