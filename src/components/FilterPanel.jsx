import { useState, useRef, useEffect, useCallback } from "react";
import { useFilters } from "../context/FilterContext";
import {
  YEARS, REGIONS, REGION_MARKET_MAP, RETAILERS,
  PERIODS, STATUS_BY_MARKET, FILTER_DEFAULTS,
  CATEGORIES, getSubCats, getSKUs, MARS,
} from "../data/mockData";

function Dropdown({ label, value, options, onChange, accent }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const wrapRef = useRef();

  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const openMenu = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuH = Math.min(options.length * 32 + 8, 160);
    const base = {
      position:"fixed", left:rect.left, width:Math.max(rect.width,170),
      background:"#fff", border:"1px solid #e0e0f0", borderRadius:8,
      boxShadow:"0 8px 28px rgba(0,0,160,.14)", zIndex:9999,
      maxHeight:160, overflowY:"auto",
    };
    setMenuStyle(spaceBelow < menuH + 8
      ? { ...base, bottom: window.innerHeight - rect.top + 3, top:"auto" }
      : { ...base, top: rect.bottom + 3, bottom:"auto" });
    setOpen(true);
  }, [options.length]);

  const displayVal = typeof value === "object" ? value?.label : String(value ?? "");
  const short = displayVal.length > 16 ? displayVal.slice(0,15)+"…" : displayVal;
  const getVal = o => typeof o === "object" ? o.value : String(o);
  const getLabel = o => typeof o === "object" ? o.label : String(o);
  const isActive = o => typeof value === "object" ? value?.value === getVal(o) : String(value) === getVal(o);

  return (
    <div ref={wrapRef} style={{ flexShrink:0 }}>
      <div style={{ fontSize:8, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".1em", marginBottom:2 }}>{label}</div>
      <button onClick={() => open ? setOpen(false) : openMenu()}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 8px", borderRadius:6, border:`1.5px solid ${open ? accent : "#e0e0f0"}`, background: open ? `${accent}08` : "#f8f8fc", cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:600, color:"#1a1a2e", transition:"all .15s" }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{short}</span>
        <svg style={{ width:9, height:9, color:"#8080cf", flexShrink:0, marginLeft:4, transform:open?"rotate(180deg)":"none", transition:"transform .2s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={menuStyle}>
          {options.map((opt,i) => {
            const active = isActive(opt);
            return (
              <button key={i} onClick={() => { onChange(opt); setOpen(false); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", textAlign:"left", padding:"6px 10px", fontSize:11, fontWeight:active?700:400, color:active?accent:"#1a1a2e", background:active?`${accent}10`:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}
                onMouseOver={e=>{ if(!active) e.currentTarget.style.background="#f4f4fc"; }}
                onMouseOut={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{getLabel(opt)}</span>
                {active && <svg style={{ width:9, height:9, color:accent, flexShrink:0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({ accent }) {
  const { filters, setFilter } = useFilters();
  const [collapsed, setCollapsed] = useState(false);
  const [resetting, setResetting] = useState(false);

  const status  = STATUS_BY_MARKET[filters.Market] || STATUS_BY_MARKET["UK"];
  const markets = REGION_MARKET_MAP[filters.Region] || [];
  const subCats = getSubCats(filters.Category);
  const skus    = getSKUs(filters.Category, filters.SubCategory);

  const dotC = { green: MARS.green, yellow:"#f59e0b", red: MARS.red };
  const tagB = { green:"#e0faf6", yellow:"#fef3c7", red:"#fef1f0" };
  const tagT = { green:"#006b5e", yellow:"#78350f", red:"#8b1a0a" };

  const handleReset = () => {
    setResetting(true);
    Object.entries(FILTER_DEFAULTS).forEach(([k,v]) => setFilter(k)(v));
    setTimeout(() => setResetting(false), 600);
  };

  return (
    <aside style={{ width:collapsed?38:196, transition:"width .3s", flexShrink:0, background:"#fff", borderRight:"1px solid #e8e8f4", display:"flex", flexDirection:"column", overflow:"visible", position:"relative", zIndex:20, height:"100%" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:collapsed?"center":"space-between", padding:"10px 10px 8px", flexShrink:0, borderBottom:"1px solid #f0f0f8" }}>
        {!collapsed && <span style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:MARS.blue, textTransform:"uppercase", letterSpacing:".12em" }}>Filters</span>}
        <button onClick={() => setCollapsed(v=>!v)}
          style={{ width:22, height:22, borderRadius:6, background:`${accent}12`, border:`1px solid ${accent}30`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <svg style={{ width:10, height:10, color:accent, transform:collapsed?"rotate(180deg)":"none", transition:"transform .3s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {collapsed && (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ writingMode:"vertical-rl", fontSize:8, fontFamily:"'MarsBold',system-ui", color:"#8080cf", letterSpacing:".15em", textTransform:"uppercase" }}>Filters</span>
        </div>
      )}

      {!collapsed && (
        <div style={{ flex:1, padding:"8px 10px 10px", display:"flex", flexDirection:"column", justifyContent:"space-between", overflow:"hidden", minHeight:0 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <Dropdown label="Year"         value={String(filters.Year)}    options={YEARS.map(y=>String(y))}          onChange={y=>setFilter("Year")(parseInt(y))}       accent={accent}/>
            <Dropdown label="Region"       value={filters.Region}          options={REGIONS}                          onChange={setFilter("Region")}                     accent={accent}/>
            <Dropdown label="Market"       value={filters.Market}          options={markets}                          onChange={setFilter("Market")}                     accent={accent}/>
            <Dropdown label="Retailer"     value={filters.Retailer}        options={RETAILERS}                        onChange={setFilter("Retailer")}                   accent={accent}/>
            <Dropdown label="Period"       value={filters.Period}          options={PERIODS}                          onChange={setFilter("Period")}                     accent={accent}/>
            <Dropdown label="Category"     value={filters.Category}        options={CATEGORIES}                       onChange={setFilter("Category")}                   accent={accent}/>
            <Dropdown label="Sub-Category" value={filters.SubCategory}     options={subCats}                          onChange={setFilter("SubCategory")}                accent={accent}/>
            <Dropdown label="SKU"          value={filters.SKU}             options={skus}                             onChange={setFilter("SKU")}                        accent={accent}/>
          </div>

          {/* Status */}
          <div style={{ flexShrink:0 }}>
            <div style={{ height:1, background:"#f0f0f8", margin:"7px 0 6px" }}/>
            <div style={{ fontSize:8, fontFamily:"'MarsBold',system-ui", color:"#8080cf", textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>Status</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {[
                { label:"SOV",          s:status.sov,                tag:null                     },
                { label:"Brand Health", s:status.brandHealth.status, tag:status.brandHealth.label },
                { label:"Trade Rate",   s:status.tradeRate.status,   tag:status.tradeRate.label   },
              ].map(({ label, s, tag }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 6px", background:"#f8f8fc", borderRadius:5 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:dotC[s], flexShrink:0 }}/>
                  <span style={{ fontSize:9, color:"#555577", flex:1 }}>{label}</span>
                  {tag && <span style={{ fontSize:8, fontFamily:"'MarsBold',system-ui", color:tagT[s], background:tagB[s], borderRadius:20, padding:"1px 5px", whiteSpace:"nowrap" }}>{tag}</span>}
                </div>
              ))}
            </div>
            <div style={{ height:1, background:"#f0f0f8", margin:"6px 0 7px" }}/>
            <button onClick={handleReset}
              style={{ position:"relative", width:"100%", padding:"7px 10px", borderRadius:7, border:`1.5px solid ${resetting?accent:"#e0e0f0"}`, background:resetting?`${accent}10`:"#f8f8fc", fontSize:10, fontFamily:"'MarsBold',system-ui", color:resetting?accent:"#8080cf", cursor:"pointer", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all .2s" }}
              onMouseOver={e=>{ if(!resetting){ e.currentTarget.style.borderColor=accent; e.currentTarget.style.color=accent; }}}
              onMouseOut={e=>{ if(!resetting){ e.currentTarget.style.borderColor="#e0e0f0"; e.currentTarget.style.color="#8080cf"; }}}>
              {resetting && <span style={{ position:"absolute", inset:0, background:`linear-gradient(90deg,transparent,${accent}20,transparent)`, animation:"shimmer .6s ease" }}/>}
              <svg style={{ width:10, height:10, animation:resetting?"spin .5s linear":"none" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {resetting ? "Resetting…" : "Reset Filters"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}