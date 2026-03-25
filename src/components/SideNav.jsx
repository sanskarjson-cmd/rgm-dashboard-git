import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PERSONA_CONFIG, MARS } from "../data/mockData";

// Clean SVG icons for each page
const ICONS = {
  "Home": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  "Pricing Strategy": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  "Promotions": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  "Trade & Terms": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16h6"/><path d="M19 13v6"/><path d="M12 3H3v10l9 9"/><path d="M3 3l18 18"/>
    </svg>
  ),
  "Assortment & Mix": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  "Activation": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  "Governance": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const PAGES = [
  "Home", "Pricing Strategy", "Promotions",
  "Trade & Terms", "Assortment & Mix", "Activation", "Governance",
];

export default function SideNav({ activePage, setActivePage }) {
  const { user }    = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const personaCfg = PERSONA_CONFIG[user?.role] || PERSONA_CONFIG["Finance"];
  const livePages  = personaCfg.livePages;

  return (
    <aside style={{
      width:      collapsed ? 56 : 196,
      flexShrink: 0,
      background: "#fff",
      borderRight:"1px solid #e8e8f4",
      display:    "flex",
      flexDirection: "column",
      transition: "width .2s ease",
      overflow:   "hidden",
      zIndex:     10,
    }}>

      {/* Toggle button */}
      <button onClick={() => setCollapsed(v => !v)}
        style={{ display:"flex", alignItems:"center", justifyContent: collapsed ? "center" : "flex-end", padding:"12px 12px 10px", background:"transparent", border:"none", borderBottom:"1px solid #f0f0f8", cursor:"pointer", flexShrink:0 }}>
        <svg style={{ width:16, height:16, color:"#8b8fb8", transform: collapsed ? "rotate(180deg)" : "none", transition:"transform .2s" }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Nav items */}
      <nav style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
        {PAGES.map(page => {
          const isActive = page === activePage;
          const isLive   = livePages.includes(page);
          const icon     = ICONS[page];

          return (
            <button key={page}
              onClick={() => isLive && setActivePage(page)}
              title={page}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            10,
                width:          "100%",
                padding:        collapsed ? "11px 0" : "9px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                background:     isActive ? `${MARS.blue}0e` : "transparent",
                borderLeft:     isActive ? `3px solid ${MARS.blue}` : "3px solid transparent",
                border:         "none",
                cursor:         isLive ? "pointer" : "not-allowed",
                fontFamily:     "inherit",
                opacity:        isLive ? 1 : 0.35,
                transition:     "background .15s",
              }}
              onMouseOver={e => { if(isLive && !isActive) e.currentTarget.style.background = "#f4f4fc"; }}
              onMouseOut={e =>  { if(isLive && !isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {/* Icon */}
              <span style={{ width:18, height:18, flexShrink:0, color: isActive ? MARS.blue : "#8b8fb8", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {icon}
              </span>

              {/* Label */}
              {!collapsed && (
                <span style={{ fontSize:12, fontFamily: isActive ? "'MarsBold',system-ui" : "inherit", color: isActive ? MARS.blue : "#3a3a5c", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {page}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom persona badge */}
      {!collapsed && (
        <div style={{ padding:"10px 14px", borderTop:"1px solid #f0f0f8", flexShrink:0 }}>
          <div style={{ fontSize:8, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>Persona</div>
          <div style={{ fontSize:11, fontFamily:"'MarsBold',system-ui", color:MARS.blue }}>{user?.role}</div>
        </div>
      )}
    </aside>
  );
}