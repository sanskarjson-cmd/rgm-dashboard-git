import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useFilters } from "../context/FilterContext";
import {
  NOTIFICATIONS_BY_PERSONA, PERSONAS, PERSONA_CONFIG, MARS,
  YEARS, REGIONS, REGION_MARKET_MAP, RETAILERS, PERIODS,
  CATEGORIES, getSubCats, getSKUs,
} from "../data/mockData";

export default function Navbar() {
  const { user, logout, updatePersona } = useAuth();
  const { filters, setFilter }          = useFilters();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [notifs, setNotifs] = useState(
    NOTIFICATIONS_BY_PERSONA[user?.role] || NOTIFICATIONS_BY_PERSONA["Finance"]
  );

  useEffect(() => {
    setNotifs(NOTIFICATIONS_BY_PERSONA[user?.role] || NOTIFICATIONS_BY_PERSONA["Finance"]);
  }, [user?.role]);

  const nRef = useRef(), pRef = useRef(), perRef = useRef();
  useEffect(() => {
    const fn = e => {
      if (nRef.current   && !nRef.current.contains(e.target))   setNotifOpen(false);
      if (pRef.current   && !pRef.current.contains(e.target))   setProfileOpen(false);
      if (perRef.current && !perRef.current.contains(e.target)) setPersonaOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const unread  = notifs.filter(n => !n.read).length;
  const tColor  = { warning:MARS.orange, info:MARS.skyBlue, alert:MARS.red, success:MARS.green };
  const markets = REGION_MARKET_MAP[filters.Region] || [];
  const subCats = getSubCats(filters.Category);
  const skus    = getSKUs(filters.Category, filters.SubCategory);

  // Filter select component
  const Sel = ({ label, value, options, onChange, width = 90 }) => (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".08em", whiteSpace:"nowrap" }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width, padding:"3px 6px", borderRadius:5, border:"1px solid #e0e0f0", background:"#f8f8fc", color:"#1a1a2e", fontSize:10, fontFamily:"inherit", cursor:"pointer", outline:"none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  // Dropdown box
  const DropBox = ({ children, right }) => (
    <div style={{ position:"absolute", top:"calc(100% + 8px)", [right?"right":"left"]:0, background:"#fff", border:"1px solid #e0e0f0", borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,160,.14)", zIndex:400, minWidth:190, padding:6, animation:"fadeUp .15s ease" }}>
      {children}
    </div>
  );

  const DropItem = ({ onClick, children, danger }) => (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", padding:"8px 10px", fontSize:12, color:danger?MARS.red:"#1a1a2e", background:"transparent", border:"none", cursor:"pointer", borderRadius:8, fontFamily:"inherit" }}
      onMouseOver={e => e.currentTarget.style.background = danger?"#fff1f0":"#f4f4fc"}
      onMouseOut={e => e.currentTarget.style.background = "transparent"}>
      {children}
    </button>
  );

  return (
    <header style={{ flexShrink:0, boxShadow:"0 2px 16px rgba(0,0,160,.14)", zIndex:50 }}>

      {/* ── Top bar ── */}
      <div style={{ background:`linear-gradient(135deg, ${MARS.blue} 0%, #0000c8 100%)`, height:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", borderBottom:`2px solid ${MARS.yellow}` }}>

        {/* Brand */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, background:MARS.yellow, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(255,220,0,.4)", flexShrink:0 }}>
            <span style={{ fontFamily:"'MarsExtrabold',system-ui", fontSize:11, color:MARS.blue, letterSpacing:1 }}>RG</span>
          </div>
          <div>
            <span style={{ fontFamily:"'MarsExtrabold',system-ui", fontSize:14, color:MARS.yellow, letterSpacing:3, textTransform:"uppercase" }}>Mars</span>
            <span style={{ color:"rgba(255,220,0,.3)", fontSize:16, margin:"0 6px" }}>|</span>
            <span style={{ fontFamily:"'MarsBold',system-ui", fontSize:12, color:"rgba(255,255,255,.75)", letterSpacing:1 }}>RGM Intelligence</span>
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>

          {/* Persona */}
          <div ref={perRef} style={{ position:"relative" }}>
            <button onClick={() => { setPersonaOpen(v=>!v); setNotifOpen(false); setProfileOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.1)", border:`1px solid ${personaOpen?MARS.yellow:"rgba(255,255,255,.18)"}`, borderRadius:7, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>
              <span style={{ fontSize:9, color:"rgba(255,255,255,.5)" }}>Persona</span>
              <span style={{ fontSize:11, fontFamily:"'MarsBold',system-ui", color:"#fff" }}>{user?.role}</span>
              <svg style={{ width:8, height:8, color:"rgba(255,255,255,.4)", transform:personaOpen?"rotate(180deg)":"none", transition:"transform .2s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {personaOpen && (
              <DropBox>
                <div style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#aab", textTransform:"uppercase", letterSpacing:".1em", padding:"4px 10px 6px" }}>Switch Persona</div>
                {PERSONAS.map((p, i) => (
                  <DropItem key={i} onClick={() => { updatePersona(p); setPersonaOpen(false); }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:user?.role===p?MARS.blue:"#dde", display:"inline-block", flexShrink:0 }}/>
                    <span style={{ fontFamily:user?.role===p?"'MarsBold',system-ui":"inherit", color:user?.role===p?MARS.blue:"#1a1a2e" }}>{p}</span>
                    <span style={{ marginLeft:"auto", fontSize:9, color:"#8b8fb8" }}>{p==="Executive"?"Full access":"Finance view"}</span>
                  </DropItem>
                ))}
              </DropBox>
            )}
          </div>

          {/* Bell */}
          <div ref={nRef} style={{ position:"relative" }}>
            <button onClick={() => { setNotifOpen(v=>!v); setPersonaOpen(false); setProfileOpen(false); }}
              style={{ position:"relative", background:"rgba(255,255,255,.1)", border:`1px solid ${notifOpen?MARS.yellow:"rgba(255,255,255,.18)"}`, borderRadius:7, padding:"6px 8px", cursor:"pointer", display:"flex" }}>
              <svg style={{ width:15, height:15, color:"rgba(255,255,255,.8)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {unread > 0 && <span style={{ position:"absolute", top:2, right:2, width:15, height:15, background:MARS.red, borderRadius:"50%", fontSize:8, fontFamily:"'MarsBold',system-ui", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${MARS.blue}` }}>{unread}</span>}
            </button>
            {notifOpen && (
              <DropBox right>
                <div style={{ width:290 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 10px 8px" }}>
                    <span style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#aab", textTransform:"uppercase", letterSpacing:".1em" }}>Notifications · {user?.role}</span>
                    {unread > 0 && <button onClick={() => setNotifs(n=>n.map(x=>({...x,read:true})))} style={{ fontSize:10, fontFamily:"'MarsBold',system-ui", color:MARS.blue, background:"none", border:"none", cursor:"pointer" }}>Mark all read</button>}
                  </div>
                  {notifs.map(n => (
                    <div key={n.id} onClick={() => setNotifs(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x))}
                      style={{ display:"flex", gap:8, padding:"8px 10px", borderRadius:8, cursor:"pointer", background:n.read?"transparent":`${MARS.blue}06`, marginBottom:1 }}
                      onMouseOver={e=>e.currentTarget.style.background="#f4f4fc"}
                      onMouseOut={e=>e.currentTarget.style.background=n.read?"transparent":`${MARS.blue}06`}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:n.read?"#ddd":tColor[n.type], flexShrink:0, marginTop:4 }}/>
                      <div>
                        <p style={{ fontSize:12, fontFamily:n.read?"inherit":"'MarsBold',system-ui", color:"#1a1a2e" }}>{n.title}</p>
                        <p style={{ fontSize:11, color:"#8b8fb8", marginTop:1, lineHeight:1.4 }}>{n.body}</p>
                        <p style={{ fontSize:10, color:"#bbb", marginTop:2 }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DropBox>
            )}
          </div>

          {/* Avatar */}
          <div ref={pRef} style={{ position:"relative" }}>
            <button onClick={() => { setProfileOpen(v=>!v); setNotifOpen(false); setPersonaOpen(false); }}
              style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg, ${MARS.yellow}, #ffb300)`, border:`2px solid ${profileOpen?"#fff":"rgba(255,255,255,.3)"}`, cursor:"pointer", fontFamily:"'MarsExtrabold',system-ui", fontSize:12, color:MARS.blue, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}>
              {user?.initials}
            </button>
            {profileOpen && (
              <DropBox right>
                <div style={{ padding:"10px 12px", borderBottom:"1px solid #f0f0f8", marginBottom:4 }}>
                  <div style={{ fontSize:13, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e" }}>{user?.name}</div>
                  <div style={{ fontSize:11, color:"#8b8fb8", marginTop:2 }}>{user?.email}</div>
                  <span style={{ display:"inline-block", marginTop:6, fontSize:9, background:`${MARS.blue}12`, color:MARS.blue, borderRadius:20, padding:"2px 9px", fontFamily:"'MarsBold',system-ui", textTransform:"uppercase", letterSpacing:".08em" }}>{user?.role}</span>
                </div>
                <DropItem>My Profile</DropItem>
                <DropItem>Settings</DropItem>
                <div style={{ height:1, background:"#f0f0f8", margin:"4px 0" }}/>
                <DropItem onClick={logout} danger>Sign out</DropItem>
              </DropBox>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter strip — always visible, no scroll, fit in one glance ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e8e8f4", padding:"5px 16px", display:"flex", alignItems:"center", gap:6, flexWrap:"nowrap", boxShadow:"0 1px 4px rgba(0,0,160,.04)" }}>
        <Sel label="Year"     value={String(filters.Year)}  options={YEARS.map(y=>String(y))}
          onChange={y => { setFilter("Year")(parseInt(y)); }} width={58} />
        <Sel label="Region"   value={filters.Region}        options={REGIONS}
          onChange={r => { setFilter("Region")(r); setFilter("Market")(REGION_MARKET_MAP[r]?.[0]||""); }} width={92} />
        <Sel label="Market"   value={filters.Market}        options={markets}
          onChange={setFilter("Market")} width={72} />
        <Sel label="Retailer" value={filters.Retailer}      options={RETAILERS}
          onChange={setFilter("Retailer")} width={100} />
        <Sel label="Period"   value={filters.Period}        options={PERIODS}
          onChange={setFilter("Period")} width={46} />
        <div style={{ width:1, height:16, background:"#e0e0f0", flexShrink:0, margin:"0 2px" }}/>
        <Sel label="Category"  value={filters.Category}     options={CATEGORIES}
          onChange={cat => setFilter("Category")(cat)} width={100} />
        <Sel label="Sub-Cat"   value={filters.SubCategory}  options={subCats.length?subCats:[filters.SubCategory]}
          onChange={setFilter("SubCategory")} width={88} />
        <Sel label="SKU"       value={filters.SKU}          options={skus.length?skus:[filters.SKU]}
          onChange={setFilter("SKU")} width={120} />
        {/* Reset */}
        <button onClick={() => {
          setFilter("Year")(2026); setFilter("Region")("Europe");
          setFilter("Market")("UK"); setFilter("Retailer")("All Retailers");
          setFilter("Period")("P3"); setFilter("Category")("Confectionery");
          setFilter("SubCategory")("Chocolate"); setFilter("SKU")("Snickers 50g");
        }} style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:6, border:`1px solid ${MARS.blue}25`, background:`${MARS.blue}06`, color:MARS.blue, fontSize:10, fontFamily:"'MarsBold',system-ui", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all .15s" }}
          onMouseOver={e=>{ e.currentTarget.style.background=MARS.blue; e.currentTarget.style.color="#fff"; }}
          onMouseOut={e=>{ e.currentTarget.style.background=`${MARS.blue}06`; e.currentTarget.style.color=MARS.blue; }}>
          ↺ Reset
        </button>
      </div>
    </header>
  );
}