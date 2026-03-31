import { MERGED_IMG } from './assets';

const CardRow = ({ icon, title, sub1, sub2 }) => (
  <div style={{ display:"flex",alignItems:"center",gap:16 }}>
    <div style={{ width:64,height:64,borderRadius:14,flexShrink:0,overflow:"hidden" }}>{icon}</div>
    <div style={{ flex:1,minWidth:0 }}>
      <div style={{ fontSize:21,fontWeight:500,color:"#111",letterSpacing:"-0.03em",lineHeight:1.2,marginBottom:7 }}>{title}</div>
      <div style={{ display:"flex",alignItems:"center",gap:14,color:"#9ca3af",fontSize:16,fontWeight:400 }}>
        <span>{sub1}</span>
        <span style={{ width:1,height:16,background:"#d1d5db" }}/>
        <span>{sub2}</span>
      </div>
    </div>
  </div>
);

const ShimmerText = ({ children, style }) => (
  <span style={{
    ...style,
    background: "linear-gradient(90deg, #999 25%, #ddd 37%, #999 63%)",
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmer 1.5s ease infinite",
  }}>{children}</span>
);

const MergedCard = ({ visible, onPointerDown }) => (
  <div
    onPointerDown={onPointerDown}
    style={{
    width: 442, borderRadius: 22, background: "white",
    padding: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    animation: visible ? "revealIn 0.54s cubic-bezier(0.25, 1, 0.5, 1) forwards" : "none",
    opacity: visible ? 1 : 0,
    cursor: "grab", touchAction: "none",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}><img src={`data:image/jpeg;base64,${MERGED_IMG}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <span style={{ fontSize: 21, fontWeight: 500, color: "#111", letterSpacing: "-0.03em", lineHeight: 1.2 }}>Intense Workout Playlist</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8b7cc8", background: "#ede9f6", borderRadius: 6, padding: "2px 8px", letterSpacing: "0.01em" }}>New</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#9ca3af", fontSize: 16, fontWeight: 400 }}>
          <span>Wednesday</span>
          <span style={{ width: 1, height: 16, background: "#d1d5db" }} />
          <span>30 min</span>
        </div>
      </div>
    </div>
  </div>
);

const MobCardRow = ({ icon, title, sub1, sub2 }) => (
  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
    <div style={{ width:48,height:48,borderRadius:11,flexShrink:0,overflow:"hidden" }}>{icon}</div>
    <div style={{ flex:1,minWidth:0 }}>
      <div style={{ fontSize:16,fontWeight:500,color:"#111",letterSpacing:"-0.03em",lineHeight:1.2,marginBottom:5 }}>{title}</div>
      <div style={{ display:"flex",alignItems:"center",gap:10,color:"#9ca3af",fontSize:13,fontWeight:400 }}>
        <span>{sub1}</span>
        <span style={{ width:1,height:13,background:"#d1d5db" }}/>
        <span>{sub2}</span>
      </div>
    </div>
  </div>
);

const MobShimmerText = ({ children, style }) => (
  <span style={{
    ...style,
    background: "linear-gradient(90deg, #999 25%, #ddd 37%, #999 63%)",
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmer 1.5s ease infinite",
  }}>{children}</span>
);

const MobMergedCard = ({ visible, onPointerDown }) => (
  <div
    onPointerDown={onPointerDown}
    style={{
    width: 340, borderRadius: 18, background: "white",
    padding: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    animation: visible ? "revealIn 0.54s cubic-bezier(0.25, 1, 0.5, 1) forwards" : "none",
    opacity: visible ? 1 : 0,
    cursor: "grab", touchAction: "none",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 11, overflow: "hidden", flexShrink: 0 }}><img src={`data:image/jpeg;base64,${MERGED_IMG}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: "#111", letterSpacing: "-0.03em", lineHeight: 1.2 }}>Intense Workout Playlist</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8b7cc8", background: "#ede9f6", borderRadius: 6, padding: "2px 8px", letterSpacing: "0.01em" }}>New</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#9ca3af", fontSize: 13, fontWeight: 400 }}>
          <span>Wednesday</span>
          <span style={{ width: 1, height: 13, background: "#d1d5db" }} />
          <span>30 min</span>
        </div>
      </div>
    </div>
  </div>
);

export { CardRow, ShimmerText, MergedCard, MobCardRow, MobShimmerText, MobMergedCard };
