import type { ConnectionState } from "./connectRoom";

export const CONNECTION_CHECK_MS = 2000;
// Relays take a few seconds to open, at the start and after the network or a
// sleeping phone comes back, so only a longer loss counts.
const MISSES_UNTIL_CUT_OFF = 5;

// Without a server, a player is cut off only when neither a relay nor another
// player can be reached. Players already linked keep playing without relays.
export function createConnectionWatch(
  onChange: (state: ConnectionState) => void,
) {
  let state: ConnectionState = "connecting";
  let misses = 0;

  function report(next: ConnectionState) {
    if (next === state) return;
    state = next;
    onChange(next);
  }

  return {
    check(openRelays: number, linkedPeers: number) {
      if (openRelays > 0 || linkedPeers > 0) {
        misses = 0;
        report("connected");
        return;
      }
      misses += 1;
      if (misses >= MISSES_UNTIL_CUT_OFF) report("disconnected");
    },
    // Every relay failed to open, so there is nothing left to wait for.
    stopWaiting() {
      misses = MISSES_UNTIL_CUT_OFF;
    },
  };
}
