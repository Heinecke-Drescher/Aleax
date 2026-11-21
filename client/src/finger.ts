// A finger hides what lies under it, so what it drags, on the map or onto it, sits this many
// screen pixels above it.
export const FINGER_OFFSET = 60;

// A wheel event and a drag stopped without an event have no pointer type.
export function isFinger(evt: Event | undefined) {
  return (
    evt !== undefined && "pointerType" in evt && evt.pointerType === "touch"
  );
}
