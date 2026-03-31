import { useState, useRef, useEffect, useCallback } from "react";
import { mkImg, WORKOUT_IMG, MUSIC_IMG } from './assets';
import { MobCardRow, MobShimmerText, MobMergedCard } from './helpers';

const STIFFNESS = 0.032;
const DAMPING = 0.88;
const PROXIMITY_PX = 180;

function CardDragExperimentMobile() {
  const [v1, setV1] = useState({ prox:0,dragging:false,docked:false });
  const [v2, setV2] = useState({ prox:0,dragging:false,docked:false });
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);
  const [resetHov, setResetHov] = useState(false);
  const [mergePhase, setMergePhase] = useState(null); // null | "glow" | "collapse" | "reveal"
  const [mergedDrag, setMergedDrag] = useState({ x:0, y:0, dragging:false });
  const mergedRef = useRef(null);
  const mergedPhys = useRef({ dragging:false, px0:0, py0:0, ox:0, oy:0 });

  const mergedDown = useCallback((e) => {
    e.preventDefault();
    const s = mergedPhys.current;
    s.dragging = true; s.px0 = e.clientX; s.py0 = e.clientY;
    s.ox = mergedDrag.x || 0; s.oy = mergedDrag.y || 0;
    setMergedDrag(prev => ({ ...prev, dragging: true }));
  }, [mergedDrag.x, mergedDrag.y]);

  useEffect(() => {
    const move = (e) => {
      const s = mergedPhys.current;
      if (!s.dragging) return;
      const nx = s.ox + (e.clientX - s.px0);
      const ny = s.oy + (e.clientY - s.py0);
      setMergedDrag({ x: nx, y: ny, dragging: true });
    };
    const up = () => {
      const s = mergedPhys.current;
      if (!s.dragging) return;
      s.dragging = false;
      setMergedDrag(prev => ({ x: 0, y: 0, dragging: false }));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const o1 = useRef(null);
  const o2 = useRef(null);
  const raf1 = useRef(null);
  const raf2 = useRef(null);

  const p1 = useRef({ x:0,y:0,vx:0,vy:0,prox:0,dragging:false,docked:false,inOrbit:null,fired:false,
    px0:0,py0:0,ox:0,oy:0, fixedLeft:0,fixedTop:0,restLeft:0,restTop:0,targetCx:0,targetCy:0 });
  const p2 = useRef({ x:0,y:0,vx:0,vy:0,prox:0,dragging:false,docked:false,inOrbit:null,fired:false,
    px0:0,py0:0,ox:0,oy:0, fixedLeft:0,fixedTop:0,restLeft:0,restTop:0,targetCx:0,targetCy:0 });

  const card1Wrap = useRef(null);

  const calcProxPtr = useCallback((px, py, tcx, tcy) => {
    const dist = Math.hypot(px - tcx, py - tcy);
    return Math.max(0, 1 - dist / PROXIMITY_PX);
  }, []);

  const makeLoop = useCallback((s, setV, dragRef, staticRef, rafRef, loopFn, otherPhysics) => {
    const now = performance.now();

    // Docked: settle to 0
    if (s.docked && !s.dragging) {
      s.prox += (1 - s.prox) * 0.3;
      if (s.prox > 0.995) s.prox = 1;
      const ty = s.dockTargetY || 0;
      s.x = 0; s.y = ty; s.vx = 0; s.vy = 0;
    }

    // Spring back when not dragging and not docked
    if (!s.dragging && !s.docked) {
      const px=s.x,py=s.y;
      s.vx=s.vx*DAMPING-s.x*STIFFNESS; s.vy=s.vy*DAMPING-s.y*STIFFNESS;
      s.x+=s.vx; s.y+=s.vy;
      if(px*s.x<0) s.vx*=0.5; if(py*s.y<0) s.vy*=0.5;
      s.prox += (0-s.prox)*0.15;
      if (s.prox < 0.002) s.prox = 0;
    }

    // During drag: proximity from pointer to frozen target
    if (s.dragging) {
      const otherDocked = otherPhysics?.current?.docked;
      if (otherDocked) {
        s.prox += (0 - s.prox) * 0.25;
        if (s.prox < 0.002) s.prox = 0;
        s.inOrbit = null; s.fired = false;
      } else {
        const raw = calcProxPtr(s.lastPX || 0, s.lastPY || 0, s.targetCx, s.targetCy);
        if (raw > 0.01) {
          if (!s.inOrbit) s.inOrbit = now;
          s.fired = true; // instant trigger
        } else { s.inOrbit = null; s.fired = false; }
        const tp = s.fired ? 1 : 0;
        s.prox += (tp - s.prox) * 0.25;
        if (s.prox < 0.002) s.prox = 0;
      }
    }

    setV({ prox: s.prox, dragging: s.dragging, docked: s.docked });

    // When not dragging, update transform from physics
    if (!s.dragging && dragRef.current) {
      if (s.docked) {
        // Capture where card is on screen right now
        const currentRect = dragRef.current.getBoundingClientRect();

        // Remove fixed positioning to get DOM rest position
        dragRef.current.style.position = "";
        dragRef.current.style.left = "";
        dragRef.current.style.top = "";
        dragRef.current.style.transition = "none";
        dragRef.current.style.transform = "none";

        // Measure where the DOM position is
        const restRect = dragRef.current.getBoundingClientRect();

        // Calculate dock target: if dockTargetY was requested, recalculate using restRect
        let targetY = 0;
        if (s.dockTargetY !== 0 && staticRef.current) {
          const staticRect = staticRef.current.getBoundingClientRect();
          // Dock below the static card's content row (92px from its top)
          targetY = (staticRect.top + 76) - restRect.top;
        }

        // Calculate offset from current screen pos to rest pos
        const offX = currentRect.left - restRect.left;
        const offY = currentRect.top - (restRect.top + targetY);

        // Clamp offset to prevent overshoot on fast throws
        const maxOff = 120;
        const clampedX = Math.max(-maxOff, Math.min(maxOff, offX));
        const clampedY = Math.max(-maxOff, Math.min(maxOff, offY));

        // Set translate to that offset from target (visually no change)
        const d = Math.max(-8, Math.min(8, clampedX * 0.012));
        dragRef.current.style.transform = `translate(${clampedX}px,${clampedY + targetY}px) rotate(${d}deg)`;

        // Next frame: animate to final position
        requestAnimationFrame(() => {
          if (dragRef.current) {
            dragRef.current.style.transition = `transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)`;
            dragRef.current.style.transform = `translate(0px,${targetY}px)`;
          }
        });
        s.x = 0; s.y = targetY;
      } else {
        // Capture where card is on screen now
        const currentRect = dragRef.current.getBoundingClientRect();

        // Remove fixed positioning
        dragRef.current.style.position = "";
        dragRef.current.style.left = "";
        dragRef.current.style.top = "";
        dragRef.current.style.transition = "none";
        dragRef.current.style.transform = "none";

        // Measure DOM rest position
        const restRect = dragRef.current.getBoundingClientRect();

        const offX = currentRect.left - restRect.left;
        const offY = currentRect.top - restRect.top;
        const d = Math.max(-8, Math.min(8, offX * 0.012));
        dragRef.current.style.transform = `translate(${offX}px,${offY}px) rotate(${d}deg)`;

        // Animate back to origin
        requestAnimationFrame(() => {
          if (dragRef.current) {
            dragRef.current.style.transition = `transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)`;
            dragRef.current.style.transform = "translate(0px,0px)";
          }
        });
        // Kill the spring — CSS handles it
        s.x = 0; s.y = 0; s.vx = 0; s.vy = 0;
      }
    }

    const still = !s.dragging && !s.docked && Math.abs(s.x)<0.2 && Math.abs(s.y)<0.2 && Math.abs(s.vx)<0.1 && Math.abs(s.vy)<0.1 && s.prox<0.002;
    const dockedStill = s.docked && !s.dragging && Math.abs(s.prox-1)<0.01;

    if (still) {
      s.x=0;s.y=0;s.vx=0;s.vy=0;s.prox=0;
      setV({prox:0,dragging:false,docked:false});
    } else if (dockedStill) {
      s.prox=1;
      setV({prox:1,dragging:false,docked:true});
    } else {
      rafRef.current = requestAnimationFrame(loopFn);
    }
  }, [calcProxPtr]);

  const loop1=useCallback(()=>makeLoop(p1.current,setV1,o1,o2,raf1,loop1,p2),[makeLoop]);
  const start1=useCallback(()=>{if(raf1.current)cancelAnimationFrame(raf1.current);raf1.current=requestAnimationFrame(loop1);},[loop1]);

  const down1=useCallback((e)=>{
    e.preventDefault();
    const s=p1.current;
    const el=o1.current; if(!el)return;
    const r=el.getBoundingClientRect();
    // Snapshot static card center
    if(o2.current){const r2=o2.current.getBoundingClientRect();s.targetCx=r2.left+r2.width/2;s.targetCy=r2.top+r2.height/2;}
    // Record grab offset within card
    s.grabOffX=e.clientX-r.left; s.grabOffY=e.clientY-r.top;
    s.restLeft=r.left; s.restTop=r.top;
    // Switch to fixed positioning
    el.style.position="fixed"; el.style.left=r.left+"px"; el.style.top=r.top+"px";
    el.style.transform="none"; el.style.transition="none";
    el.style.zIndex="100";
    s.wasDocked=s.docked;s.dragging=true;s.docked=false;s.inOrbit=null;s.fired=false;
    s.lastPX=e.clientX;s.lastPY=e.clientY;
    start1();
  },[start1]);

  const move1=useCallback((e)=>{
    const s=p1.current;if(!s.dragging)return;
    s.lastPX=e.clientX;s.lastPY=e.clientY;
    // Slight pull toward target when in proximity
    let tx=e.clientX-s.grabOffX, ty=e.clientY-s.grabOffY;
    if(s.prox>0.01){
      const pull=s.prox*0.08;
      tx+=(s.targetCx-170-tx)*pull;
      ty+=(s.targetCy-38-ty)*pull;
    }
    if(o1.current){
      const dx=tx-(s.restLeft);
      const d=Math.max(-8,Math.min(8,dx*0.012));
      o1.current.style.left=tx+"px"; o1.current.style.top=ty+"px";
      o1.current.style.transform=`rotate(${d}deg)`;
    }
    // Track offset from rest for spring-back
    s.x=tx-s.restLeft; s.y=ty-s.restTop;
  },[]);

  const up1=useCallback(()=>{
    const s=p1.current;if(!s.dragging)return;
    s.dragging=false;
    if(s.fired){
      s.docked=true;s.vx=0;s.vy=0;
      s.dockTargetY = 1; // Flag: dock into the other card (actual value calculated in makeLoop)
    } else {s.docked=false;s.prox=0;s.dockTargetY=0;}
    s.inOrbit=null;s.fired=false;
    if(o1.current){o1.current.style.zIndex="";}
    start1();
  },[start1]);

  const loop2=useCallback(()=>makeLoop(p2.current,setV2,o2,o1,raf2,loop2,p1),[makeLoop]);
  const start2=useCallback(()=>{if(raf2.current)cancelAnimationFrame(raf2.current);raf2.current=requestAnimationFrame(loop2);},[loop2]);

  const down2=useCallback((e)=>{
    e.preventDefault();
    const s=p2.current;
    const el=o2.current; if(!el)return;
    const r=el.getBoundingClientRect();
    if(o1.current){const r2=o1.current.getBoundingClientRect();s.targetCx=r2.left+r2.width/2;s.targetCy=r2.top+r2.height/2;}
    s.grabOffX=e.clientX-r.left; s.grabOffY=e.clientY-r.top;
    s.restLeft=r.left; s.restTop=r.top;
    el.style.position="fixed"; el.style.left=r.left+"px"; el.style.top=r.top+"px";
    el.style.transform="none"; el.style.transition="none";
    el.style.zIndex="100";
    s.wasDocked=s.docked;s.dragging=true;s.docked=false;s.inOrbit=null;s.fired=false;
    s.lastPX=e.clientX;s.lastPY=e.clientY;
    start2();
  },[start2]);

  const move2=useCallback((e)=>{
    const s=p2.current;if(!s.dragging)return;
    s.lastPX=e.clientX;s.lastPY=e.clientY;
    let tx=e.clientX-s.grabOffX, ty=e.clientY-s.grabOffY;
    if(s.prox>0.01){
      const pull=s.prox*0.08;
      tx+=(s.targetCx-170-tx)*pull;
      ty+=(s.targetCy-38-ty)*pull;
    }
    if(o2.current){
      const dx=tx-(s.restLeft);
      const d=Math.max(-8,Math.min(8,dx*0.012));
      o2.current.style.left=tx+"px"; o2.current.style.top=ty+"px";
      o2.current.style.transform=`rotate(${d}deg)`;
    }
    s.x=tx-s.restLeft; s.y=ty-s.restTop;
  },[]);

  const up2=useCallback(()=>{
    const s=p2.current;if(!s.dragging)return;
    s.dragging=false;
    if(s.fired){s.docked=true;s.vx=0;s.vy=0;s.dockTargetY=0;}
    else{s.docked=false;s.prox=0;s.dockTargetY=0;}
    s.inOrbit=null;s.fired=false;
    if(o2.current){o2.current.style.zIndex="";}
    start2();
  },[start2]);

  useEffect(()=>{
    const m=e=>{move1(e);move2(e);};
    const u=()=>{up1();up2();};
    window.addEventListener("pointermove",m);
    window.addEventListener("pointerup",u);
    return()=>{window.removeEventListener("pointermove",m);window.removeEventListener("pointerup",u);
      if(raf1.current)cancelAnimationFrame(raf1.current);if(raf2.current)cancelAnimationFrame(raf2.current);};
  },[move1,move2,up1,up2]);

  const expand1 = (v2.prox > 0.15 || v2.docked) ? 1 : 0;
  const expand2 = (v1.prox > 0.15 || v1.docked) ? 1 : 0;
  const anyDocked = v1.docked || v2.docked;
  const anyActive = v1.prox > 0.01 || v2.prox > 0.01;

  // Merge sequence: glow → collapse → reveal → auto-reset
  const doReset = useCallback(() => {
    setMergePhase(null);
    setMergedDrag({ x:0, y:0, dragging:false });
    mergedPhys.current.dragging = false;
    const s=p1.current;s.docked=false;s.dragging=false;s.prox=0;s.vx=0;s.vy=0;s.x=0;s.y=0;s.inOrbit=null;s.fired=false;s.dockTargetY=0;
    if(o1.current){o1.current.style.position="";o1.current.style.left="";o1.current.style.top="";o1.current.style.transform="";o1.current.style.zIndex="";}
    start1();
    const s2=p2.current;s2.docked=false;s2.dragging=false;s2.prox=0;s2.vx=0;s2.vy=0;s2.x=0;s2.y=0;s2.inOrbit=null;s2.fired=false;s2.dockTargetY=0;
    if(o2.current){o2.current.style.position="";o2.current.style.left="";o2.current.style.top="";o2.current.style.transform="";o2.current.style.zIndex="";}
    start2();
  }, [start1, start2]);

  useEffect(() => {
    if (anyDocked && !mergePhase) {
      setMergePhase("glow");
      const t1 = setTimeout(() => setMergePhase("collapse"), 1200);
      const t2 = setTimeout(() => setMergePhase("reveal"), 1800);
      const t3 = setTimeout(() => doReset(), 6800); // 5s after reveal
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [anyDocked, doReset]);

  // Determine if we're in glow phase (cards still visible with effects)
  const isGlowing = mergePhase === "glow";
  const isCollapsing = mergePhase === "collapse";
  const isRevealed = mergePhase === "reveal";

  const renderCard = (icon, title, sub1, sub2, outerRef, v, isHov, setHov, onDown, expand, extraBotPx) => {
    const { prox, dragging, docked } = v;
    const extraBot = expand * extraBotPx;
    const isMoving = dragging;
    const isDocked = docked && !dragging;
    const hoverScale = (expand || isDocked) ? 1 : (isHov ? 1.02 : 1);
    const expandScale = expand && !isDocked && !dragging ? 1.015 : 1;
    const finalScale = isDocked ? 0.94 : hoverScale * expandScale;
    const showGlow = !isDocked && expand > 0 && isGlowing; // glow on the MAIN (receiving) card
    const showShimmer = isGlowing; // shimmer text on ALL cards during glow

    return (
      <div style={{ width: 340, overflow: "visible", position: "relative" }}>
        <div ref={outerRef} style={{
          willChange: "transform", position: "relative",
          zIndex: isMoving ? 100 : 1,
        }}>
          <div onPointerDown={(!isGlowing && !isCollapsing && !isRevealed) ? onDown : undefined}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
              cursor: (isGlowing || isCollapsing || isRevealed) ? "default" : dragging ? "grabbing" : "grab",
              touchAction: "none",
              transform: dragging ? "none" : `scale(${finalScale})`,
              transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
            }}>
            {/* Gradient border wrapper when glowing */}
            {showGlow && <div style={{
              position: "absolute", inset: -1, borderRadius: 19, zIndex: -1,
              background: `conic-gradient(from var(--border-angle, 0deg), #FA445C, #B6F237, #FA445C)`,
              animation: "borderRotate 2s linear infinite",
            }} />}
            <div style={{
              width: 340, borderRadius: 18,
              background: isDocked ? "#F3F3F3" : (dragging && prox > 0.1) ? "#F3F3F3" : "white",
              overflow: "hidden",
              padding: `10px 10px ${10 + extraBot}px 10px`,
              boxShadow: (isDocked || prox > 0.1)
                  ? "none"
                  : isMoving
                    ? "0 48px 120px rgba(0,0,0,0.10),0 24px 60px rgba(0,0,0,0.06),0 8px 24px rgba(0,0,0,0.04)"
                    : expand > 0.01
                      ? `0 ${4 + expand * 8}px ${16 + expand * 24}px rgba(0,0,0,${0.06 + expand * 0.04})`
                      : "0 4px 16px rgba(0,0,0,0.05)",
              transition: "background 0.3s ease, box-shadow 0.3s ease, padding 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
            }}>
              {showShimmer ? (
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:48,height:48,borderRadius:11,flexShrink:0,overflow:"hidden" }}>{icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ marginBottom:5 }}>
                      <MobShimmerText style={{ fontSize:16,fontWeight:500,letterSpacing:"-0.03em",lineHeight:1.2 }}>{title}</MobShimmerText>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:400 }}>
                      <MobShimmerText style={{}}>{sub1}</MobShimmerText>
                      <span style={{ width:1,height:13,background:"#d1d5db" }}/>
                      <MobShimmerText style={{}}>{sub2}</MobShimmerText>
                    </div>
                  </div>
                </div>
              ) : (
                <MobCardRow icon={icon} title={title} sub1={sub1} sub2={sub2} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width:"100%",height:"100%",background:"#e2e5ed",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontFamily:"'Inter',-apple-system,sans-serif",userSelect:"none",position:"relative" }}>
      <div style={{ position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",color:"#9aa0b4",fontSize:11,whiteSpace:"nowrap",opacity:anyActive||anyDocked?0:1,transition:"opacity 0.5s ease",pointerEvents:"none" }}>
        Drag a card onto the other ↕
      </div>

      <button onClick={()=>{
        setMergePhase(null);
        const s=p1.current;s.docked=false;s.dragging=false;s.prox=0;s.vx=0;s.vy=0;s.x=0;s.y=0;s.inOrbit=null;s.fired=false;s.dockTargetY=0;
        if(o1.current){o1.current.style.position="";o1.current.style.left="";o1.current.style.top="";o1.current.style.transform="";o1.current.style.zIndex="";}
        start1();
        const s2=p2.current;s2.docked=false;s2.dragging=false;s2.prox=0;s2.vx=0;s2.vy=0;s2.x=0;s2.y=0;s2.inOrbit=null;s2.fired=false;
        if(o2.current){o2.current.style.position="";o2.current.style.left="";o2.current.style.top="";o2.current.style.transform="";o2.current.style.zIndex="";}
        start2();
      }} onMouseEnter={()=>setResetHov(true)} onMouseLeave={()=>setResetHov(false)}
        style={{ position:"absolute",bottom:24,left:"50%",transform:`translateX(-50%) translateY(${(anyDocked||mergePhase)?0:12}px)`,opacity:(anyDocked||mergePhase)?1:0,pointerEvents:(anyDocked||mergePhase)?"auto":"none",transition:"opacity 0.35s ease,transform 0.35s ease",background:"white",border:"none",borderRadius:8,padding:"8px 18px",fontSize:11,fontWeight:500,color:resetHov?"#111":"#333",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",fontFamily:"'Inter',-apple-system,sans-serif",display:"flex",alignItems:"center" }}>
        <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:resetHov?22:0,height:18,flexShrink:0,overflow:"hidden",transition:"width 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform:resetHov?"scale(1)":"scale(0)",opacity:resetHov?1:0,transition:"transform 0.25s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s ease" }}>
            <path d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13H4C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13C20 8.58 16.42 5 12 5Z" fill="#111"/>
          </svg>
        </span>
        Reset
      </button>

      <div style={{ display:"flex",flexDirection:"column",gap:80,position:"relative",zIndex:50,height:232 }}>
        {/* Cards container — collapses when merging */}
        <div style={{
          animation: isCollapsing ? "collapseOut 0.6s cubic-bezier(0.4, 0, 1, 1) forwards" : "none",
          opacity: isRevealed ? 0 : 1,
          pointerEvents: (isCollapsing || isRevealed) ? "none" : "auto",
          display: "flex", flexDirection: "column", gap: 80, position: "relative",
        }}>
          <div ref={card1Wrap} style={{ position: "relative", minHeight: 76, zIndex: (v1.dragging || v1.docked) ? 100 : 1 }}>
            {renderCard(mkImg(WORKOUT_IMG),"High-intensity Workout","Wednesday","30 min",o1,v1,hover1,setHover1,down1,expand1,76)}
            {/* Dotted snap guide — positioned where Card B lands when docked into A */}
            {(() => {
              const showGuide = expand1 && v2.dragging && v2.prox > 0.15;
              return <div style={{
                position: "absolute",
                top: 76,
                left: 0,
                width: 340,
                height: 76,
                transformOrigin: "center center",
                transform: "scale(0.94)",
                opacity: showGuide ? 1 : 0,
                transition: showGuide ? "opacity 0.2s ease" : "opacity 0.05s ease",
                pointerEvents: "none",
                zIndex: 1,
              }}>
                <svg width="340" height="76" style={{ position:"absolute", top:0, left:0 }}>
                  <rect x="0.5" y="0.5" width="339" height="75" rx="18" ry="18"
                    fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1"
                    strokeDasharray="8 6" />
                </svg>
              </div>;
            })()}
          </div>
          <div style={{ position: "relative", minHeight: 76, marginTop: expand1 ? -156 : 0, transition: "margin-top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)", zIndex: v2.dragging ? 100 : 1 }}>
            {renderCard(mkImg(MUSIC_IMG),"Your Library","325 Songs","84 Artists",o2,v2,hover2,setHover2,down2,expand2,86)}
            {/* Dotted snap guide — positioned where Card A lands when docked into B */}
            {(() => {
              const showGuide = expand2 && v1.dragging && v1.prox > 0.15;
              return <div style={{
                position: "absolute",
                top: 76,
                left: 0,
                width: 340,
                height: 76,
                transformOrigin: "center center",
                transform: "scale(0.94)",
                opacity: showGuide ? 1 : 0,
                transition: showGuide ? "opacity 0.2s ease" : "opacity 0.05s ease",
                pointerEvents: "none",
                zIndex: 1,
              }}>
                <svg width="340" height="76" style={{ position:"absolute", top:0, left:0 }}>
                  <rect x="0.5" y="0.5" width="339" height="75" rx="18" ry="18"
                    fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1"
                    strokeDasharray="8 6" />
                </svg>
              </div>;
            })()}
          </div>
        </div>

        </div>

        {/* Merged card — appears after collapse, centered in viewport */}
        {isRevealed && (
          <div ref={mergedRef} style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginLeft: -170,
            marginTop: -38,
            width: 340,
            cursor: mergedDrag.dragging ? "grabbing" : "grab",
            transform: `translate(${mergedDrag.x}px,${mergedDrag.y}px)${Math.abs(mergedDrag.x) > 0.5 ? ` rotate(${Math.max(-8, Math.min(8, mergedDrag.x * 0.012))}deg)` : ""}`,
            transition: mergedDrag.dragging ? "none" : "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
            zIndex: 200,
          }}>
            <MobMergedCard visible={true} onPointerDown={mergedDown} />
          </div>
        )}
    </div>
  );
}

export default CardDragExperimentMobile;
