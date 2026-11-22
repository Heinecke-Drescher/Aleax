import "./noPageZoom.css";

// Safari's own pinch events, for the iOS versions that zoom the page despite touch-action.
// Other browsers never send them.
for (const type of ["gesturestart", "gesturechange"]) {
  document.addEventListener(type, (event) => event.preventDefault());
}
