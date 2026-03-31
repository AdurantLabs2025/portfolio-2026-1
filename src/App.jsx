import { useState, useEffect, useRef, useCallback } from "react";
import "./styles/keyframes";
import CardDragExperiment from "./components/experiments/CardDrag/CardDragExperiment";
import CardDragExperimentMobile from "./components/experiments/CardDrag/CardDragMobile";
import CardDragV2Experiment from "./components/experiments/AttentionZone/AttentionZoneExperiment";
import CardDragV2ExperimentMobile from "./components/experiments/AttentionZone/AttentionZoneMobile";
import DynamicUIExperiment from "./components/experiments/DynamicUI/DynamicUIExperiment";

function ResponsiveAttentionZone() {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(w < 900 ? Math.max(0.55, w / 900) : 1);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div style={{
        width: scale < 1 ? `${100 / scale}%` : "100%",
        height: scale < 1 ? `${100 / scale}%` : "100%",
        transform: scale < 1 ? `scale(${scale})` : "none",
        transformOrigin: "top left",
      }}>
        <CardDragV2Experiment />
      </div>
    </div>
  );
}

function HCIVideo() {
  const vidRef = useCallback((v) => {
    if (!v) return;
    v.defaultMuted = true;
    v.muted = true;
    v.play().catch(() => {});
  }, []);
  return (
    <div style={{
      width: "100%", height: "100%", background: "#e2e5ed",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <div style={{
        width: "min(546px, calc(100% - 64px))",
        aspectRatio: "1 / 1",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 30px 100px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.04)",
      }}>
        <video
          ref={vidRef}
          src="/HCI.mp4"
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline=""
          onEnded={(e) => { e.target.currentTime = 0; e.target.play(); }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.75)" }}
        />
      </div>
    </div>
  );
}

function HCIVideoMobile() {
  const vidRef = useCallback((v) => {
    if (!v) return;
    v.defaultMuted = true;
    v.muted = true;
    v.play().catch(() => {});
  }, []);
  return (
    <video
      ref={vidRef}
      src="/HCI.mp4"
      autoPlay
      loop
      muted
      playsInline
      webkit-playsinline=""
      onEnded={(e) => { e.target.currentTime = 0; e.target.play(); }}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.75)" }}
    />
  );
}

const EXPERIMENTS = [
  {
    id: 1,
    title: "Artifact Creation",
    body: <>Merge single items into contextual artifacts<br/>guided by intelligence and preferences.</>,
    mobileBody: <>Merge single items into contextual artifacts guided<br/>by intelligence and preferences.</>,
    component: CardDragExperiment,
    mobileComponent: CardDragExperimentMobile,
    mobileSize: { w: "100%", h: "100%", scale: 1, frameH: 528, interactive: true, native: true },
  },
  {
    id: 2,
    title: "Attention Zone",
    body: "An attention zone revealing further insights while guiding user interactions with logic and memory.",
    component: ResponsiveAttentionZone,
    mobileComponent: CardDragV2ExperimentMobile,
    mobileSize: { w: "100%", h: "100%", scale: 1, frameH: 528, interactive: true, native: true },
  },
  {
    id: 3,
    title: "Dynamic UI",
    body: "Fluid interfaces that mold themselves to context and action items. Organic and without constraints.",
    component: DynamicUIExperiment,
    mobileSize: { w: 800, h: 1050, scale: 0.54, frameH: 528, interactive: true },
  },
  {
    id: 4,
    title: "HCI Research",
    body: "Every direction is examined to reveal pitfalls and novel ideas to achieve a human touch and feeling.",
    mobileBody: <>Every direction is examined to reveal pitfalls and novel<br/>ideas to achieve a human touch and feeling.</>,
    component: HCIVideo,
    mobileComponent: HCIVideoMobile,
    mobileSize: { w: "100%", h: "100%", scale: 1, frameH: 528, interactive: false, native: true },
  },
];

// ── Responsive hook ──────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ── Footer (shared) ─────────────────────────────────────────────────
function Footer({ style }) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.6, color: "#c0c0c0", ...style }}>
      © 2026 Designed and developed by — Lukas Kmoth
    </div>
  );
}

// ── Orb SVG (shared) ────────────────────────────────────────────────
function OrbSvg({ className }) {
  return (
    <svg className={className} viewBox="0 0 805 802" fill="none" xmlns="http://www.w3.org/2000/svg"><rect opacity="0.2" width="804.705" height="802" rx="401" fill="url(#orbGrad1)"/><g filter="url(#orbBlur)"><rect x="169.055" y="167.703" width="466.594" height="466.594" rx="233.297" fill="url(#orbGrad2)"/></g><defs><filter id="orbBlur" x="47.2326" y="45.8806" width="710.239" height="710.239" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="60.9114" result="effect1_foregroundBlur"/></filter><linearGradient id="orbGrad1" x1="122.996" y1="70.6493" x2="703.235" y2="658.803" gradientUnits="userSpaceOnUse"><stop stopColor="#8C95DF"/><stop offset="0.543269" stopColor="#81BBDB"/><stop offset="1" stopColor="#8CCACF"/></linearGradient><linearGradient id="orbGrad2" x1="240.372" y1="208.806" x2="577.961" y2="549.85" gradientUnits="userSpaceOnUse"><stop stopColor="#8C95DF"/><stop offset="0.543269" stopColor="#81BBDB"/><stop offset="1" stopColor="#8CCACF"/></linearGradient></defs></svg>
  );
}


// ── Main App ────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState(1);
  const active = EXPERIMENTS.find((e) => e.id === activeId);
  const ActiveComponent = active?.component;

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            height: auto;
            overflow: auto;
          }
        `}</style>

        <div style={{ padding: "32px 16px 48px", maxWidth: 480, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 80, padding: "50vh 16px 0 16px" }}>
            <div style={{ fontSize: 32, fontWeight: 400, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.3 }}>HCI Designer</div>
            <div style={{ fontSize: 17, lineHeight: 1.6, color: "#777", marginTop: 14 }}>Designing since 16'. Founder of <a href="https://0-1-0.ai" target="_blank" rel="noopener noreferrer" style={{ color: "#111", textDecoration: "none" }}>0-1-0</a>.</div>
            <div style={{ width: "100%", height: 1, background: "#e0e0e0", marginTop: 24, marginBottom: 24 }} />
            <div style={{ fontSize: 13, lineHeight: 1.7, color: "#777" }}>Researching the bridge between intelligence,<br/>emotions and human interaction.</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: "#777", marginTop: 20 }}>Follow me on <a href="#" style={{ color: "#111", textDecoration: "none" }}>Twitter/X</a>, or send me an <a href="mailto:" style={{ color: "#111", textDecoration: "none" }}>Email</a>.</div>
          </div>

          {/* Experiments feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>
            {EXPERIMENTS.map((exp) => {
              const Comp = exp.mobileComponent || exp.component;
              const ms = exp.mobileSize;
              return (
                <div key={exp.id}>
                  {/* Preview frame */}
                  <div style={{
                    width: "100%",
                    height: ms ? ms.frameH : 380,
                    borderRadius: 18,
                    overflow: "hidden",
                    position: "relative",
                    background: "#e2e5ed",
                  }}>
                    {Comp && ms ? (
                      ms.native ? (
                        <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zoom: ms.zoom || 1 }}>
                          <Comp />
                        </div>
                      ) : (
                        <>
                          <div style={{
                            width: ms.w,
                            height: ms.h,
                            position: "absolute",
                            top: 0,
                            left: "50%",
                            transform: `translateX(-50%) scale(${ms.scale})`,
                            transformOrigin: "top center",
                          }}>
                            <Comp />
                          </div>
                          {!ms.interactive && (
                            <div style={{
                              position: "absolute",
                              inset: 0,
                              zIndex: 999,
                            }} />
                          )}
                        </>
                      )
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#edeef2" }}>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#c0c0c0", letterSpacing: "0.04em" }}>
                          Coming soon
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title + body below preview */}
                  <div style={{ marginTop: 24, padding: "0 16px" }}>
                    <span style={{ fontSize: 18, fontWeight: 400, color: "#111", letterSpacing: "-0.01em" }}>{exp.title}</span>
                  </div>
                  {(exp.mobileBody || exp.body) && (
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "#777", marginTop: 10, padding: "0 16px" }}>{exp.mobileBody || exp.body}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <Footer style={{ marginTop: 48, textAlign: "center" }} />
        </div>
      </>
    );
  }

  // ── DESKTOP LAYOUT (unchanged) ────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', sans-serif;
          background: #fff;
          height: 100vh;
          overflow: hidden;
        }

        .shell {
          display: flex;
          height: 100vh;
          width: 100vw;
          padding: 24px;
        }

        .sidebar {
          width: 440px;
          min-width: 440px;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 0 48px;
          position: relative;
        }

        .exp-item {
          padding: 12px 0;
          cursor: pointer;
          position: relative;
          height: 48px;
          overflow: hidden;
          transition: height 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .exp-item.active {
          height: 130px;
        }

        @media (max-height: 820px) {
          .exp-item.active {
            height: 48px;
          }
          .exp-item.active .exp-body {
            display: none;
          }
        }

        .exp-item + .exp-item {
          margin-top: 4px;
        }

        @media (min-height: 1000px) {
          .exp-item + .exp-item {
            margin-top: 16px;
          }
        }

        .exp-label {
          display: flex;
          align-items: center;
          padding-left: 24px;
        }

        .exp-orb {
          position: absolute;
          left: 0;
          top: 19px;
          width: 14px;
          height: 14px;
          opacity: 0;
          transform: scale(0.4);
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .exp-item.active .exp-orb {
          opacity: 1;
          transform: scale(1);
        }

        .exp-title {
          font-size: 20px;
          font-weight: 400;
          color: #c0c0c0;
          letter-spacing: -0.01em;
          transition: color 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateX(0);
        }

        .exp-item.active .exp-title {
          color: #111;
          font-weight: 400;
        }

        .exp-item:hover:not(.active) .exp-title {
          color: #888;
        }

        .exp-body {
          font-size: 13px;
          line-height: 2.4;
          color: #777;
          margin-top: 8px;
          padding-left: 24px;
          opacity: 0;
          transform: translateY(8px);
          filter: blur(2px);
          transition: opacity 0.15s ease,
                      transform 0.15s ease,
                      filter 0.15s ease,
                      line-height 0.15s ease;
        }

        .exp-item.active .exp-body {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0px);
          line-height: 1.6;
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s,
                      transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s,
                      filter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s,
                      line-height 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.08s;
        }

        .preview {
          flex: 1;
          height: 100%;
          padding-left: 120px;
          min-width: 0;
        }

        .preview-frame {
          width: 100%;
          height: 100%;
          background: #edeef2;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .empty-state {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #c0c0c0;
          letter-spacing: 0.04em;
        }
      `}</style>

      <div className="shell">
        <div className="sidebar">
          <div style={{ paddingTop: 48, paddingRight: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 400, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.3 }}>HCI Designer</div>
            <div style={{ fontSize: 16, lineHeight: 1.6, color: "#777", marginTop: 12 }}>Designing since 16'. Founder of <a href="https://0-1-0.ai" target="_blank" rel="noopener noreferrer" style={{ color: "#111", textDecoration: "none" }}>0-1-0</a>.</div>
            <div style={{ width: "100%", height: 1, background: "#e0e0e0", marginTop: 16, marginBottom: 16 }} />
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#777" }}>Researching the bridge between intelligence,<br/>emotions and human interaction.</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#777", marginTop: 4 }}>Follow me on <a href="#" style={{ color: "#111", textDecoration: "none" }}>Twitter/X</a>, or send me an <a href="mailto:" style={{ color: "#111", textDecoration: "none" }}>Email</a>.</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
            {EXPERIMENTS.map((exp) => (
              <div
                key={exp.id}
                className={`exp-item ${activeId === exp.id ? "active" : ""}`}
                onClick={() => setActiveId(exp.id)}
              >
                <OrbSvg className="exp-orb" />
                <div className="exp-label">
                  <span className="exp-title">{exp.title}</span>
                </div>
                {exp.body && (
                  <div className="exp-body">{exp.body}</div>
                )}
              </div>
            ))}
          </div>
          <Footer style={{ paddingBottom: 48, flexShrink: 0 }} />
        </div>

        <div className="preview">
          <div className="preview-frame">
            {ActiveComponent ? (
              <ActiveComponent key={activeId} />
            ) : (
              <div className="empty-state">
                Drop your JSX component here
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
