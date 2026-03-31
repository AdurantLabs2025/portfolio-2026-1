// Inject keyframes for shimmer + glow
const styleEl = document.createElement("style");
styleEl.textContent = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes borderRotate {
  0% { --border-angle: 0deg; }
  100% { --border-angle: 360deg; }
}
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes collapseOut {
  0% { transform: scale(1); opacity: 1; filter: blur(0px); }
  60% { transform: scale(0.92); opacity: 0.8; filter: blur(2px); }
  100% { transform: scale(0.5); opacity: 0; filter: blur(12px); }
}
@keyframes revealIn {
  0% { transform: scale(0.7); opacity: 0; filter: blur(8px); }
  60% { transform: scale(1.02); opacity: 1; filter: blur(0px); }
  100% { transform: scale(1); opacity: 1; filter: blur(0px); }
}
`;
document.head.appendChild(styleEl);
