import { useState, useRef, useEffect, useCallback } from "react";

const M2_ORBIT_RADIUS  = 250;
const M2_STIFFNESS     = 0.08;
const M2_DAMPING       = 0.78;
const M2_TRIGGER_DELAY = 300;
const M2_SCALE = 0.58;
const M2_CARD_Y_REST = 160;

function CardDragV2ExperimentMobile() {
  const [visual, setVisual] = useState({ x: 0, y: 0, prox: 0, shellProx: 0, cardScale: 1 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [resetHovered, setResetHovered] = useState(false);

  const cardRef = useRef(null);
  const iconRef = useRef(null);
  const outerRef = useRef(null);
  const rafRef  = useRef(null);

  const p = useRef({
    x: 0, y: 0, vx: 0, vy: 0,
    prox: 0, shellProx: 0, shellV: 0,
    dragging: false, docked: false,
    inOrbitSince: null, delayFired: false,
    px0: 0, py0: 0, ox: 0, oy: 0,
  });

  const calcRaw = useCallback(() => {
    if (!iconRef.current || !cardRef.current) return 0;
    const icon = iconRef.current.getBoundingClientRect();
    const card = cardRef.current.getBoundingClientRect();
    const ix = icon.left + icon.width / 2;
    const iy = icon.top + icon.height / 2;
    const cardCx = card.left + card.width / 2;
    const cardCy = card.top + card.height / 2;
    const dist = Math.hypot(cardCx - ix, cardCy - iy);
    return Math.max(0, 1 - dist / M2_ORBIT_RADIUS);
  }, []);

  const loop = useCallback(() => {
    const s = p.current;
    const now = performance.now();
    if (!s.dragging && !s.docked) {
      const prevX = s.x; const prevY = s.y;
      s.vx = s.vx * M2_DAMPING - s.x * M2_STIFFNESS;
      s.vy = s.vy * M2_DAMPING - s.y * M2_STIFFNESS;
      s.x += s.vx; s.y += s.vy;
      if (prevX * s.x < 0) s.vx *= 0.5;
      if (prevY * s.y < 0) s.vy *= 0.5;
    }
    if (s.docked && !s.dragging) {
      s.prox += (1 - s.prox) * 0.18;
      if (s.prox > 0.998) s.prox = 1;
      s.shellV = s.shellV * 0.78 - (s.shellProx - 1) * 0.12;
      s.shellProx = Math.max(0, Math.min(1.08, s.shellProx + s.shellV));
    }
    if (s.dragging) {
      const rawProx = calcRaw();
      if (rawProx > 0.01) {
        if (!s.inOrbitSince) s.inOrbitSince = now;
        if (!s.delayFired && now - s.inOrbitSince >= M2_TRIGGER_DELAY) s.delayFired = true;
      } else { s.inOrbitSince = null; s.delayFired = false; }
      const targetProx = s.delayFired ? 1 : 0;
      s.prox += (targetProx - s.prox) * 0.18;
      if (s.prox < 0.002) s.prox = 0;
      s.shellV = s.shellV * 0.78 - (s.shellProx - targetProx) * 0.12;
      s.shellProx = Math.max(0, Math.min(1.08, s.shellProx + s.shellV));
    }
    if (!s.dragging && !s.docked) {
      s.prox += (0 - s.prox) * 0.25;
      if (s.prox < 0.002) s.prox = 0;
      s.shellV = s.shellV * 0.78 - s.shellProx * 0.12;
      s.shellProx = Math.max(0, Math.min(1.08, s.shellProx + s.shellV));
      if (Math.abs(s.shellProx) < 0.002) { s.shellProx = 0; s.shellV = 0; }
    }
    const rawProx = s.dragging ? calcRaw() : 0;
    const waitProgress = (s.dragging && rawProx > 0.01 && !s.delayFired && s.inOrbitSince)
      ? Math.min(1, (now - s.inOrbitSince) / M2_TRIGGER_DELAY) : 0;
    const cardScale = s.dragging ? 1 - s.prox * 0.04 - waitProgress * 0.01
      : s.docked ? 0.96 : 1;
    setVisual({ x: s.x, y: s.y, prox: s.prox, shellProx: s.shellProx, cardScale, dragging: s.dragging, docked: s.docked });
    if (!s.dragging && outerRef.current) {
      const deg = Math.max(-8, Math.min(8, s.x * 0.012));
      outerRef.current.style.transform = `translate(${s.x}px, calc(${M2_CARD_Y_REST}px + ${s.y}px)) rotate(${deg}deg)`;
    }
    const still = !s.dragging && !s.docked && Math.abs(s.x) < 0.2 && Math.abs(s.y) < 0.2 && Math.abs(s.vx) < 0.1 && Math.abs(s.vy) < 0.1 && s.prox < 0.002 && Math.abs(s.shellProx) < 0.002;
    if (still) { s.x = 0; s.y = 0; s.vx = 0; s.vy = 0; s.prox = 0; s.shellProx = 0; s.shellV = 0; setVisual({ x: 0, y: 0, prox: 0, shellProx: 0, cardScale: 1, docked: false }); }
    else { rafRef.current = requestAnimationFrame(loop); }
  }, [calcRaw]);

  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const s = p.current;
    s.dragging = true; s.docked = false;
    s.px0 = e.clientX; s.py0 = e.clientY;
    s.ox = s.x; s.oy = s.y;
    s.inOrbitSince = null; s.delayFired = false;
    startLoop();
  }, [startLoop]);

  const onPointerMove = useCallback((e) => {
    const s = p.current;
    if (!s.dragging) return;
    s.x = s.ox + (e.clientX - s.px0) / M2_SCALE;
    s.y = s.oy + (e.clientY - s.py0) / M2_SCALE;
    if (outerRef.current) {
      const deg = Math.max(-8, Math.min(8, s.x * 0.012));
      outerRef.current.style.transform = `translate(${s.x}px, calc(${M2_CARD_Y_REST}px + ${s.y}px)) rotate(${deg}deg)`;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    const s = p.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (s.delayFired) { s.docked = true; s.vx = 0; s.vy = 0; }
    else { s.docked = false; s.prox = 0; s.shellProx = 0; s.shellV = 0; setHoveredOption(null); }
    s.inOrbitSince = null; s.delayFired = false;
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onPointerMove, onPointerUp]);

  const { x, y, prox, shellProx, cardScale, dragging = false, docked = false } = visual;
  const revealed = prox > 0.01;
  const pad    = shellProx * 20;
  const padBot = shellProx * 128;
  const optionsOpacity = Math.max(0, (prox - 0.2) / 0.8);

  const glowR = Math.round(120 + (1 - 120) * prox);
  const glowG = Math.round(90 + (138 - 90) * prox);
  const glowB = Math.round(220 + (76 - 220) * prox);

  const options = [
    "Explore similar items by Goeritz",
    "Order Goeritz Bench - $999.00",
  ];

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "#e8eaef",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, sans-serif",
      userSelect: "none", position: "relative",
    }}>

      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(${glowR},${glowG},${glowB},${prox * 0.28}) 0%, transparent 80%)`,
      }} />

      {/* Hint */}
      <div style={{
        position: "absolute", bottom: 30, left: "50%",
        transform: "translateX(-50%)",
        color: "#9aa0b4", fontSize: 11, whiteSpace: "nowrap",
        opacity: (revealed || docked) ? 0 : 1,
        transition: "opacity 0.5s ease", pointerEvents: "none",
      }}>
        Drag the card toward the icon ↑
      </div>

      {/* Reset CTA */}
      <button
        onClick={() => {
          const s = p.current;
          s.docked = false; s.dragging = false;
          s.prox = 0; s.shellProx = 0; s.shellV = 0;
          s.inOrbitSince = null; s.delayFired = false;
          setHoveredOption(null);
          startLoop();
        }}
        onMouseEnter={() => setResetHovered(true)}
        onMouseLeave={() => setResetHovered(false)}
        style={{
          position: "absolute", bottom: 24, left: "50%",
          transform: `translateX(-50%) translateY(${docked ? 0 : 12}px)`,
          opacity: docked ? 1 : 0,
          pointerEvents: docked ? "auto" : "none",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          background: "white", border: "none", borderRadius: 8,
          padding: "8px 18px", fontSize: 11, fontWeight: 500,
          color: resetHovered ? "#111" : "#333", cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          fontFamily: "'Inter', -apple-system, sans-serif",
          display: "flex", alignItems: "center",
        }}
      >
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: resetHovered ? 22 : 0, height: 18, flexShrink: 0, overflow: "hidden",
          transition: "width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{
            transform: resetHovered ? "scale(1)" : "scale(0)",
            opacity: resetHovered ? 1 : 0,
            transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
          }}>
            <path d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13H4C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13C20 8.58 16.42 5 12 5Z" fill="#111" />
          </svg>
        </span>
        Reset
      </button>

      {/* Icon — positioned at top center, outside the scaled container */}
      <div ref={iconRef} style={{
        position: "absolute", top: 32, left: "50%",
        transform: `translateX(-50%) scale(${M2_SCALE})`,
        transformOrigin: "center center",
        width: 64, height: 64, background: "white", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 5,
        boxShadow: revealed
          ? `0 0 0 ${prox * 6}px rgba(${glowR},${glowG},${glowB},${prox * 0.22}), 0 8px 28px rgba(${glowR},${glowG},${glowB},${prox * 0.28})`
          : "0 2px 12px rgba(0,0,0,0.08)",
      }}>
        <svg width={30} height={30} viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="15" fill="url(#gi_blue_m)" />
          <circle cx="15" cy="15" r="15" fill="url(#gi_green_m)" style={{ opacity: prox }} />
          <defs>
            <linearGradient id="gi_blue_m" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9B7FE8" />
              <stop offset="0.45" stopColor="#6FBBE0" />
              <stop offset="1" stopColor="#7DD4C8" />
            </linearGradient>
            <linearGradient id="gi_green_m" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#02B866" />
              <stop offset="0.45" stopColor="#018A4C" />
              <stop offset="1" stopColor="#006B3A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* === EVERYTHING below is inside the scaled container === */}
      <div style={{ transform: `scale(${M2_SCALE})`, transformOrigin: "center center" }}>
        {/* Card slot */}
        <div style={{ position: "relative", zIndex: 50 }}>
        <div style={{ width: 360, height: 500, flexShrink: 0, overflow: "visible" }}>
        <div
          ref={outerRef}
          style={{
            position: "relative",
            transform: `translate(${x}px, calc(${M2_CARD_Y_REST}px + ${y}px)) rotate(${Math.max(-8, Math.min(8, x * 0.012))}deg)`,
            willChange: "transform",
            zIndex: 50,
            display: "flex", flexDirection: "column", alignItems: "center",
          }}
        >
          <div
            onPointerDown={onPointerDown}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              cursor: p.current.dragging ? "grabbing" : "grab",
              touchAction: "none",
              transform: `scale(${p.current.dragging ? Math.max(1.02, cardScale + 0.02) : isHovering ? 1.02 : 1})`,
              transition: "transform 0.3s ease",
            }}
          >
            {/* Grey shell */}
            <div style={{
              position: "relative",
              padding: `${pad}px ${pad}px ${pad + padBot}px ${pad}px`,
              borderRadius: `${24 + pad * 0.4}px`,
              background: `rgba(243,243,243,${prox})`,
              boxShadow: prox > 0.01
                ? `0 ${4 + prox*6}px ${16 + prox*20}px rgba(0,0,0,${0.05 + prox*0.04})`
                : "none",
            }}>

              {/* Options */}
              <div style={{
                position: "absolute",
                bottom: pad + 8, left: pad, right: pad,
                display: "flex", flexDirection: "column", gap: 4,
                opacity: optionsOpacity,
                pointerEvents: (revealed || docked) ? "auto" : "none",
              }}>
                {options.map((text, i) => (
                  <div key={i}
                    onMouseEnter={() => setHoveredOption(i)}
                    onMouseLeave={() => setHoveredOption(null)}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "12px 18px", cursor: "pointer", borderRadius: 14,
                      background: hoveredOption === i ? "#EAE7E7" : "transparent",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: hoveredOption === i ? 28 : 0, height: 24, flexShrink: 0,
                      overflow: "hidden",
                      transition: "width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{
                        transform: hoveredOption === i ? "scale(1)" : "scale(0)",
                        opacity: hoveredOption === i ? 1 : 0,
                        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
                      }}>
                        <path d="M12 4L10.59 5.41L16.17 11L4 11L4 13L16.17 13L10.58 18.58L12 20L20 12L12 4Z" fill="#111" />
                      </svg>
                    </span>
                    <span style={{ color: hoveredOption === i ? "#111" : "#565c72", fontSize: 16, letterSpacing: "-0.015em", fontWeight: 500, transition: "color 0.2s" }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* White card */}
              <div ref={cardRef} style={{
                width: 360, borderRadius: 24,
                background: "white", overflow: "hidden",
                position: "relative", zIndex: 2, flexShrink: 0,
                boxShadow: prox > 0.01 ? "none"
                  : dragging
                  ? "0 48px 120px rgba(0,0,0,0.10), 0 24px 60px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)"
                  : "0 4px 16px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.3s ease",
              }}>
                <div style={{ padding: "20px" }}>
                <div style={{ overflow: "hidden", borderRadius: 18 }}>
                  <img
                    src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAcHBwcIBwgJCQgMDAsMDBEQDg4QERoSFBIUEhonGB0YGB0YJyMqIiAiKiM+MSsrMT5IPDk8SFdOTldtaG2Pj8ABBwcHBwgHCAkJCAwMCwwMERAODhARGhIUEhQSGicYHRgYHRgnIyoiICIqIz4xKysxPkg8OTxIV05OV21obY+PwP/CABEIBLAF3QMBIgACEQEDEQH/xAAcAAEBAQADAQEBAAAAAAAAAAAAAQIDBAUGBwj/2gAIAQEAAAAA/dYgAAlAAgALAgLFgAAQAAgQAIAzplKSWUQAREpAAACKIAegyAAAAAICiAlBBUBUAgAEBABAAyaygCACIlEWAAABAD0BkaAZAAAAAQARRCglgQACBFgCAAMpQhABEFiKQAABAFd9kaADJrIAAAAiwEUACAAQCAEAQADIICWARFIAQAqAgAd4GgAMgAAAAgABKBAAQAQCAIAAM6zBYsQCARUBAUgEAqd4aCoDIAAAACAsAAQAEABAEAIAAZQUggQKgIIAAIAsd6qABkNZAAAAEFQVAEACABABABAAMgCARFBBAEABAKh6GdBUAyNMgAAAAACAQLASwAEAQBAADLQyBCAARAEACAA9AAAAzpkBrOsgAAAIABACABAEAELAAAyICABCAIAICoHoAAAZaBlrOjOsgAAAgAQACAEAILBCkAAMoABAJCKCAECoD0AAAAMtZNDIAABAACAAgCABBUAgAAyQpAIEIACABFQHoLAAAAMtGQaMgAJUAEKIBAEAEAAIAAZAIAiCAAgAAgPQKQAABnTOmQaGQAAgAAgEAIAEAAgAAZAgJYRAsFggACAeiAgAAzoBkNGQAgCKACCLACAAQAEAABkBBAiKIAQABAPRAIAAAZ0ZAAAhYSgAgQAELAAgAgAAZACCRFWEShAAEAeiAQAAAGRrOsgAQAABCFQAAgCACAABkAgQQWCJQgAEAPRAIAAAGdAZABAoRSAgAgEFQAgBAABkCFQhFCIlJSAAgB6ICLAABk0GQAAABAEABAEpAEAlIAAyASiCAERFCAAIA9EAAIAM6zoMgABKAgCAAgAgAAgIAAyCUBCACEAAgBAHpQAAQAAGQABCggAQBAAQAAglgABkAAgQlEIABACAPRAAEAAAZAAABLAQAQAIpAAQEABkBoDIhEKSCoFRABAHogAEAAAZAAAAIEACAACAAQllgBkNABkSCKEEFEQAIKj0QAAgAAyAAAAQQoQlgAAEACEAAAADJEACCFRYQAQB6KhABAABkAAAEEALAgAABCUQQAAABkEIABEAEABAPSQCAAABkAAABBFRQiAAAQAQIAAAAyEEABCWAgAEAekIAQFIAGQAAAQigCEAACAAIQLAAAMkAgAIJREAAQD0hACAqAGdZAAABAAICAAAgAIIAAADIgEACSiKiAAQB6QhYAEAAMgAABAAQQAAAgAIIVFIAMhFQECwSURYgAEAPSIVABAAMgAAAQACCAAAgAIBFlBABkIAEAIpIIABBUHogABAABkAAAIACCAAAgAEASggAMggBABAhAACCoPSIAAgAAZAAAAQBBAAAQABASwqADOsiKgCABAiAAACHogABAABnTJrIAAIAIgAAEBFEAIKIBkAIAgABCQAAAQ9EAhRAAGdZaZNM6yABAAiAAAIAEACCwBkAIAQAAiACAAQeiAQsAAIIA1kACACCAAAEAEAAiiAyAEAQqAAkACABA9EAgAAMtMgaMgAEAEIAAAgACAILADIAIBKQAIIBAAQHpQEAAADIGhkAAgBBFEAAgihAABABkAEAEACEAEAAE9EEAAADIBrIAAQRSAEAAIRYCoAAQGQAEAEACBAgAAHoBCwAAZABpkAAECABAABAACAAIDIAEACFgAyBAAAPQEogADJoDOstZNZAAQQAEAACAAIAJQgZAAgAgsAlhAQAAHoQAAAZaDI1k0ZAAIEWAIAAEgoBAAQAyABAARYCBFgQAAPQBAABloyBoDIACAEsqEAAIAAIIUlgBkEUCAAQCAQIAAHfKIAAyaM6GdM6BkAIAAIIAIUEqAISiAAZGsygIAAQIEAIAAnoFgAAZNMtGWgDIAgABEKgAAAQIAQLAZANZCAAIAQgohAID0AAAGTQGdADIBAABCAAAAQCAEsADIABABAASohUEAQHoAAAMtAZDQyACAAIQAAAQAICUgADINMhAAhYAIRSCAID0YFEAAAM6ZAAIAAiAAAAgAgAQAAAZCACCwARFIgAIL3wUBAABkaZABAAIIAAAEABACLFgAAyCBYIVABEFhLAEFd8UCAAAMmshpkEAECAAAAQAQAlQAABkCCpUQAqCIssQAQp3woIAAAZA0yBACAQLAARULLCVAEqAAAGQIKlglQ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Ol1BZICJx55103pAoJQB5cA0AABauAd9UDpqGpIQEVCCFAAEvm5gtAABV1zB32A61UyIDLRFSAAAQc/OaIolAA3rXAHfYDrpJAgQUCIqFgBA4clqCgADtXAHfVA62QRRAIoEAEASpjMzlItJQA6rxB6KUa3BAoIASiACABLFjOZM5lAF6bvmB6NIutoCCgIAQAgABKASkzmZmY121XlB3ta3YACCgQCAJSVZAAUgCxZLKnlB6LrdgACAUCAQFASBUAoAAGPJza6+npYAAIAUBAACBAACgACok3QAAAgKABFgARFgFoAAAKAAAAECoFEqAAgAFAABQAAAAAQAFQACAoAABQAAABKABAAAABFAAWFJZQAAABBYUCAKBAAAAAFAAAAACAUAAAgABQIpAUAAAAAIAKAAAEABQEAUAAAD/8QAGgEBAQEBAQEBAAAAAAAAAAAAAAECAwQFBv/aAAgBAxAAAACSgAAAAAACopAEEAAAANAAAAAAAAqUQAhLAAAATYAAAAAAAChAAixAAAA0AAAAAAAAUIAEWQAAANAAAAAAAAKCAAlgQAADQAWWAAAAABQCAEpLIAAA0AqFlhUAAAABQQAAhAAANAUAJYAAAABQIAAJAAANAUCWAAAAABQQAAQQAANAoAQAAAAAUIAAEEAADQFAEAAAAAChAAARAAA0CgJYAAAAAKEAAAIgAA0KACAAAAAAqAAAAkAANAoBAAAAAAUgAAAggADQFAIAAAAAKEogAAEQADQUAEAAAABUUJUAAARAANLKAEFQAAACkoJUAAAQQANKABBYAAAAUAlgAAAQgA1QAELAAAACgAQAAAQgA2AEUgAAAAVBQQAAAEIANgCKlCAAAAAUIAAAAkADYASygQAAAAKCAAAAIQA2AJSWVAAAAAUEAAAAQQA2AASoAAAAFAQAAAAggDZKABCwAAABQiwAAAARADYAAIAAABQAQAAAARADVAACAAAAUACAAAABIA0oAAQAAABQAgAAABKkA0WUAAgAAAFABAAAABEA0CgAQAAACgAIAAAASANABRJEWLAUVQKAAgAAABEA0AebO+iBRBYABVVQtBAAAACQDQD8x8rMl6dOnXp069OnXp16UAoAM4zjF9vWTMUqqAACIDQHi/IccAgoq769OvXp1676769N6kxjGJG9766VAAUUqrSIDQHyvy3PBJbACk0s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yZbrxLRhxwI5eyeLplCJilagLbaNbgocJLouwrbABd1zbbbbbb+jMQHA7arG0xEUrUlbakklRijFSApKm3TbdPySVGtZ7DkmFY1So9MnndK1Zv6QPi6MrN1Y0Mv+OeNPMyxIYOlxHVUAqlWv/RA2tTbbdzbbbb+kaiPDVAkkkkkkkkqSIUxGTZk+VYI2WpcOm3TbfGseUKx6NGiXxls1pGsCn7I8vlvrI42YxsaeZniTzEseJy09NocqkgEpVr/0RW1Bde77777773fdddddc/cUvDVRwgCCCEkAlakIpJKYhJ0egAAjZbarbbLLLLbUl01fyhWPUqNHrhY2i68CD7iEggXeDy7m9b1nGx8TOTmOI1gz02h0AFJUpVr1D6AralX3X3Xu+++++++++666/wB41PgUKXB41WkkkkkkuElakrZxw+iEI4ccKOCMKw4f47LPxmFlllllllhhZYYa0PGFY9So0e0MTQdwCgWfQ1ujJz1PC3lhb6wt74e6sHVYnkDPanrG6sTN8ihUaidNocjw176Ira1X333333333333333333+4rFHhqvkkkkrbUiFMYPIEMKGBHAGHZYYWWWWfj/GcP8f47DAwOGYGFlhhro6DoahWNRo0exN23txgg+shqul5nScfKcwnhazHdP8A9bj7ikewoU9NoeA4Na79EVtir77/AMn5PyXjE/JfeJ3/AJPyfk/J+T8nvCscUO+rdx2SSpJJTGXLhHBy0MsMOyyyyyyyyyy2wwssMLLLDAwsMNwjxhWNUqPZWmOFktG1OgfVappWJhZjTcXKEeYoUONOodxQ4Na7Q+gK2zV99995nffff+T8n5fy/l/N+Y435veFZseGrdx1HUDriVgDBwcDIwwrLLLLLLbTFIxItMUrbTEwssss3KOo6QrHqVHhWiAhltIw9sR0/FxsxmdC3HQPtqelmM8LMafi5OUPMUayFA+WucpLoqXCQG3KvE77273fecS+66+6+9+8Kz46nnVx0fmOJSYGT0DI7Vy2lYOVELUkuqIRCSVtpjarbLN0A9hzGsepUhGzLaXl9s4GQlPEGNDHwsbBxcLb25KHsDqmk0YzwcfIYuUlDxHGSA7Dkca31XCSSSSA27G0g0klygOhCH0BWpA8Dk86xy2O47Y+dxdcw87o+w9J2JlsvEg0222222+qSVqVu6wfGFZqll8h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"
                    alt="Goeritz Bench"
                    style={{
                      width: "100%", height: 256, objectFit: "cover",
                      display: "block", margin: 0,
                      transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                      transform: isHovering ? "scale(1.06)" : "scale(1)",
                    }}
                  />
                </div>
                </div>
                <div style={{ padding: "22px 28px 36px", textAlign: "center" }}>
                  <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: "#111", letterSpacing: "-0.04em", lineHeight: 1.15 }}>
                    Goeritz Bench
                  </h2>
                  <p style={{ margin: 0, fontSize: 16, color: "#6b7280", lineHeight: 1.55, letterSpacing: "-0.01em" }}>
                    A vibrant green furniture piece inspired<br />by the work of artist Mathias Goeritz
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default CardDragV2ExperimentMobile;
