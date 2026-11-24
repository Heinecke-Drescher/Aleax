// A finger hides what lies under it, so what it drags, on the map or onto it, sits this many
// screen pixels above it.
export const FINGER_OFFSET = 60;

// A wheel event and a drag stopped without an event have no pointer type. Konva starts its drags
// from touch events, which have none either.
export function isFinger(evt: Event | undefined) {
  if (evt === undefined) return false;
  if (evt.type.startsWith("touch")) return true;
  return "pointerType" in evt && evt.pointerType === "touch";
}

// Where on the screen an event happened; a touch event keeps it per finger.
export function clientPoint(evt: MouseEvent | TouchEvent) {
  if (!("changedTouches" in evt)) return { x: evt.clientX, y: evt.clientY };
  const touch = evt.changedTouches[0];
  if (!touch) throw new Error(`${evt.type} without a touch`);
  return { x: touch.clientX, y: touch.clientY };
}
