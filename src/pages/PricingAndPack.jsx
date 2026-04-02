import { useState, useRef, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, ReferenceLine,
} from "recharts";
import { useFilters }  from "../context/FilterContext";
import { MARS } from "../data/mockData";

const PURPLE = "#5500bb";

const hash = s => { let h=5381; for(let i=0;i<s.length;i++) h=(h*33)^s.charCodeAt(i); return Math.abs(h); };
const sr   = seed => { const x=Math.sin(seed+1)*10000; return x-Math.floor(x); };
const vary = (base,seed,range=0.12) => parseFloat((base*(1+(sr(seed)-0.5)*range)).toFixed(3));

function useWidth(ref) {
  const [w,setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const update = () => { const r=ref.current?.getBoundingClientRect(); if(r&&r.width>0) setW(Math.floor(r.width)); };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function ChartBox({ height=220, children }) {
  const ref = useRef(null);
  const w   = useWidth(ref);
  return <div ref={ref} style={{width:"100%",overflow:"hidden"}}>{w>10 && children(w,height)}</div>;
}

const Card = ({ children, style }) => (
  <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e8e8f4", boxShadow:"0 2px 10px rgba(0,0,160,.05)", ...style }}>
    {children}
  </div>
);

const InsightBox = ({ type="info", title, children }) => {
  const styles = {
    info:  { bg:"#f0f7ff", border:"#1a5fb4", title:"#1a5fb4", text:"#1a3c5e" },
    warn:  { bg:"#fffbf0", border:"#d4a017", title:"#a07000", text:"#5a3e00" },
    alert: { bg:"#fff5f5", border:MARS.red,  title:MARS.red,  text:"#5a0010" },
  }[type] || {};
  return (
    <div style={{ background:styles.bg, borderLeft:`3px solid ${styles.border}`, borderRadius:"0 8px 8px 0", padding:"10px 14px", marginBottom:12, fontSize:12, color:styles.text }}>
      <div style={{ fontSize:10, fontFamily:"'MarsBold',system-ui", textTransform:"uppercase", letterSpacing:".04em", marginBottom:3, color:styles.title }}>{title}</div>
      {children}
    </div>
  );
};

const Badge = ({ children, type="green" }) => {
  const colors = { green:{ bg:"#d4f5e2",color:"#1a7a40" }, red:{ bg:"#fde8ec",color:MARS.red }, gold:{ bg:"#fff3d0",color:"#a07000" }, blue:{ bg:"#dde8ff",color:"#1a3c8e" } }[type] || {};
  return <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:20, fontSize:10, fontFamily:"'MarsBold',system-ui", background:colors.bg, color:colors.color }}>{children}</span>;
};

function KPICard({ label, value, change, changeLabel, sub }) {
  const up = typeof change === "number" ? change >= 0 : change?.startsWith("+") || change?.startsWith("▲");
  return (
    <Card style={{ padding:"14px 16px", flex:"1 1 0", minWidth:0, borderTop:`3px solid ${PURPLE}` }}>
      <div style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontFamily:"'MarsExtrabold',system-ui", color:"#1a1a2e", lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontSize:10, fontFamily:"'MarsBold',system-ui", color:up?"#00967a":MARS.red, background:up?"#e0f7f2":"#fff1f0", borderRadius:20, padding:"1px 8px", display:"inline-block", marginBottom:4 }}>
        {changeLabel || change}
      </div>
      {sub && <div style={{ fontSize:10, color:"#8b8fb8", marginTop:2 }}>{sub}</div>}
    </Card>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,30,.75)", backdropFilter:"blur(6px)" }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:201, width:"min(92vw,1100px)", maxHeight:"88vh", background:"#fff", borderRadius:16, boxShadow:"0 32px 80px rgba(0,0,160,.2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ background:`linear-gradient(135deg,${MARS.blue},#0000c8)`, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`3px solid ${MARS.yellow}`, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:14, fontFamily:"'MarsBold',system-ui", color:"#fff" }}>{title}</div>
            {subtitle && <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:7, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.1)", cursor:"pointer", color:"#fff", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>{children}</div>
      </div>
    </>
  );
}

function ExpandBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding:"3px 10px", borderRadius:6, border:`1px solid ${MARS.blue}30`, background:`${MARS.blue}08`, fontSize:10, fontFamily:"'MarsBold',system-ui", color:MARS.blue, cursor:"pointer", transition:"all .15s", flexShrink:0 }}
      onMouseOver={e => { e.currentTarget.style.background = MARS.blue; e.currentTarget.style.color = "#fff"; }}
      onMouseOut={e  => { e.currentTarget.style.background = `${MARS.blue}08`; e.currentTarget.style.color = MARS.blue; }}>
      ⤢ Expand
    </button>
  );
}

function CardHeader({ title, sub, onExpand }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
      <div>
        <div style={{ fontSize:13, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e" }}>{title}</div>
        {sub && <div style={{ fontSize:10, color:"#8b8fb8", marginTop:2 }}>{sub}</div>}
      </div>
      <ExpandBtn onClick={onExpand}/>
    </div>
  );
}

// ─── ELASTICITY MATRIX ────────────────────────────────────────────────────────
function ElasticityMatrix({ filters }) {
  const s = hash(`matrix-${filters.Market}-${filters.Year}-${filters.Period}`);
  const BRANDS   = ["Snickers","M&M's","Twix","Skittles","Starburst"];
  const CHANNELS = ["Mass","Grocery","Conv.","Drug","E-comm"];
  const baseMatrix = [[-1.62,-1.74,-1.91,-1.88,-1.55],[-1.71,-1.83,-2.08,-2.12,-1.68],[-1.88,-1.95,-2.24,-2.31,-1.74],[-1.45,-1.62,-1.88,-1.79,-1.52],[-1.58,-1.71,-2.01,-1.96,-1.64]];
  const matrix = baseMatrix.map((row,i) => row.map((v,j) => parseFloat(vary(v,s+i*5+j,0.08).toFixed(2))));
  const cellClass = v => v>-1.7?{bg:"#d4f5e2",color:"#1a7a40"}:v>-2.0?{bg:"#fff3d0",color:"#a07000"}:{bg:"#fde8ec",color:MARS.red};
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:`110px repeat(${CHANNELS.length},1fr)`, gap:4, minWidth:480 }}>
        <div style={{ padding:"6px 8px", background:"#f4f4fc", borderRadius:6 }}></div>
        {CHANNELS.map(ch => <div key={ch} style={{ padding:"6px 8px", background:"#f4f4fc", borderRadius:6, fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textAlign:"center", textTransform:"uppercase", letterSpacing:".06em" }}>{ch}</div>)}
        {BRANDS.map((brand,i) => (
          <>
            <div key={brand} style={{ padding:"8px", background:"#f4f4fc", borderRadius:6, fontSize:11, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e", display:"flex", alignItems:"center" }}>{brand}</div>
            {matrix[i].map((v,j) => { const st=cellClass(v); return <div key={j} style={{ padding:"8px 4px", borderRadius:6, background:st.bg, color:st.color, textAlign:"center", fontSize:11, fontFamily:"'MarsBold',system-ui", cursor:"pointer", transition:"transform .15s" }} onClick={()=>alert(`${brand} × ${CHANNELS[j]}\nElasticity: ${v}\nConf. Interval: ±0.12\nModel R²: 0.87`)} onMouseOver={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>{v}</div>; })}
          </>
        ))}
      </div>
      <div style={{ display:"flex", gap:16, marginTop:10 }}>
        {[["#d4f5e2","#1a7a40","Low (< -1.7)"],["#fff3d0","#a07000","Medium (-1.7 to -2.0)"],["#fde8ec",MARS.red,"High (> -2.0)"]].map(([bg,c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:"#555" }}>
            <span style={{ width:12,height:12,background:bg,borderRadius:3,display:"inline-block",border:`1px solid ${c}40` }}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PRICE SIMULATOR ──────────────────────────────────────────────────────────
const ELAS_MAP  = { "Snickers":-1.86,"M&M's":-1.94,"Twix":-2.08,"Skittles":-1.71,"Starburst":-1.64 };
const CH_NAMES  = { 1:"Convenience",2:"Drug",3:"Mass",4:"Grocery",5:"Club" };
const CH_WEIGHTS= { 1:1.18,2:1.08,3:1.0,4:0.94,5:0.88 };

let _pricingScenarios = [];
const pricingScenarioStore = { get:()=>_pricingScenarios, add:(item)=>{_pricingScenarios=[..._pricingScenarios,item];}, clear:()=>{_pricingScenarios=[];} };

function PriceSimulator({ filters }) {
  const [brand,     setBrand]     = useState("Snickers");
  const [pricePct,  setPricePct]  = useState(5);
  const [channel,   setChannel]   = useState(3);
  const [scenarios, setScenarios] = useState(pricingScenarioStore.get());
  const [flash,     setFlash]     = useState(false);
  const [showCart,  setShowCart]  = useState(false);
  const [guardrails,setGuardrails]= useState(true);
  const GR_MIN=-5, GR_MAX=8;

  const baseE=ELAS_MAP[brand]||-1.86, chWeight=CH_WEIGHTS[channel]||1.0;
  const e=parseFloat((baseE*chWeight).toFixed(3));
  const volDelta=parseFloat((e*pricePct).toFixed(1));
  const revDelta=parseFloat((pricePct+volDelta).toFixed(1));
  const mgnDelta=parseFloat((pricePct*0.42).toFixed(1));
  const revM=(Math.abs(revDelta)*2.34).toFixed(1);

  const handleAddScenario=()=>{
    const item={id:Date.now(),brand,channel:CH_NAMES[channel],pricePct:`${pricePct>=0?"+":""}${pricePct}%`,elasticity:e,volDelta:`${volDelta>=0?"+":""}${volDelta}%`,revDelta:`${revDelta>=0?"+":""}${revDelta}%`,revImpact:`${revDelta>=0?"+":"-"}$${revM}M`,mgnDelta:`${mgnDelta>=0?"+":""}${mgnDelta}pp`,market:filters.Market,period:filters.Period};
    pricingScenarioStore.add(item); setScenarios([...pricingScenarioStore.get()]); setFlash(true); setTimeout(()=>setFlash(false),1500);
  };

  const MV=({val,label})=><div style={{textAlign:"center"}}><div style={{fontSize:16,fontFamily:"'MarsExtrabold',system-ui",color:val>=0?"#5dde91":"#ff7a8a"}}>{val>=0?"+":""}{val}%</div><div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>{label}</div></div>;

  return(
    <div>
      {showCart&&(
        <>
          <div onClick={()=>setShowCart(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,30,.6)",backdropFilter:"blur(4px)"}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:201,width:"min(90vw,820px)",background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,160,.2)"}}>
            <div style={{background:`linear-gradient(135deg,${MARS.blue},#0000c8)`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`3px solid ${MARS.yellow}`}}>
              <div><div style={{fontSize:14,fontFamily:"'MarsBold',system-ui",color:"#fff"}}>Pricing Scenario Cart</div><div style={{fontSize:11,color:"rgba(255,255,255,.55)",marginTop:1}}>{scenarios.length} scenario{scenarios.length!==1?"s":""}</div></div>
              <div style={{display:"flex",gap:8}}>
                {scenarios.length>0&&<button onClick={()=>{const keys=Object.keys(scenarios[0]);const csv=[keys.join(","),...scenarios.map(r=>keys.map(k=>`"${r[k]}"`).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="pricing_scenarios.csv";a.click();}} style={{padding:"6px 14px",borderRadius:7,border:"none",background:MARS.yellow,fontSize:11,fontFamily:"'MarsBold',system-ui",color:MARS.blue,cursor:"pointer"}}>↓ Download CSV</button>}
                <button onClick={()=>{pricingScenarioStore.clear();setScenarios([]);}} style={{padding:"6px 12px",borderRadius:7,border:"1px solid rgba(255,255,255,.3)",background:"transparent",fontSize:11,fontFamily:"'MarsBold',system-ui",color:"#fff",cursor:"pointer"}}>Clear</button>
                <button onClick={()=>setShowCart(false)} style={{width:32,height:32,borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
            <div style={{padding:"16px 20px",overflowY:"auto",maxHeight:"60vh"}}>
              {scenarios.length===0
                ?<div style={{textAlign:"center",padding:"40px 0",color:"#8b8fb8",fontSize:13}}>No scenarios saved yet.</div>
                :<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"2px solid #e8e8f4",background:"#f8f8fc"}}>{["Brand","Channel","Price Δ","Elasticity","Vol Δ","Rev Δ","Rev Impact","Margin Δ","Market","Period"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{scenarios.map((r,i)=>(<tr key={r.id} style={{borderBottom:"1px solid #f0f0f8",background:i%2===0?"#fff":"#f9f9fc"}}><td style={{padding:"8px 10px",fontSize:11,fontFamily:"'MarsBold',system-ui",color:MARS.blue}}>{r.brand}</td><td style={{padding:"8px 10px",fontSize:11}}>{r.channel}</td><td style={{padding:"8px 10px",fontSize:11,fontFamily:"'MarsBold',system-ui",color:parseFloat(r.pricePct)>=0?"#00967a":MARS.red}}>{r.pricePct}</td><td style={{padding:"8px 10px",fontSize:11}}>{r.elasticity}</td><td style={{padding:"8px 10px",fontSize:11,fontFamily:"'MarsBold',system-ui",color:parseFloat(r.volDelta)>=0?"#00967a":MARS.red}}>{r.volDelta}</td><td style={{padding:"8px 10px",fontSize:11,fontFamily:"'MarsBold',system-ui",color:parseFloat(r.revDelta)>=0?"#00967a":MARS.red}}>{r.revDelta}</td><td style={{padding:"8px 10px",fontSize:11,fontFamily:"'MarsBold',system-ui",color:parseFloat(r.revImpact)>=0?"#00967a":MARS.red}}>{r.revImpact}</td><td style={{padding:"8px 10px",fontSize:11}}>{r.mgnDelta}</td><td style={{padding:"8px 10px",fontSize:11}}>{r.market}</td><td style={{padding:"8px 10px",fontSize:11}}>{r.period}</td></tr>))}</tbody></table>
              }
            </div>
          </div>
        </>
      )}

      <div style={{marginBottom:12}}>
        <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>Brand</div>
        <select value={brand} onChange={e=>setBrand(e.target.value)} style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #e8e8f4",fontSize:12,color:"#1a1a2e",background:"#f8f8fc",fontFamily:"inherit",cursor:"pointer"}}>
          {Object.keys(ELAS_MAP).map(b=><option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid #f0f0f8"}}>
        <div style={{width:120,fontSize:12,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>Price Change %</div>
        <input type="range" min={-15} max={15} value={pricePct} onChange={e=>{const v=parseInt(e.target.value);setPricePct(guardrails?Math.min(GR_MAX,Math.max(GR_MIN,v)):v);}} style={{flex:1,accentColor:MARS.blue}}/>
        <div style={{width:44,textAlign:"right",fontSize:13,fontFamily:"'MarsExtrabold',system-ui",color:MARS.red}}>{pricePct>=0?"+":""}{pricePct}%</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid #f0f0f8"}}>
        <div style={{width:120,fontSize:12,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>Channel Weight</div>
        <input type="range" min={1} max={5} value={channel} onChange={e=>setChannel(parseInt(e.target.value))} style={{flex:1,accentColor:MARS.blue}}/>
        <div style={{width:80,textAlign:"right"}}>
          <div style={{fontSize:10,fontFamily:"'MarsBold',system-ui",color:MARS.blue}}>{CH_NAMES[channel]}</div>
          <div style={{fontSize:9,color:"#8b8fb8"}}>×{chWeight.toFixed(2)}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0f8"}}>
        <div>
          <div style={{fontSize:12,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>Respect Guardrails</div>
          <div style={{fontSize:9,color:guardrails?"#00967a":MARS.red,marginTop:1}}>{guardrails?`✓ Capped: ${GR_MIN}% to +${GR_MAX}%`:"⚠ Full range unlocked"}</div>
        </div>
        <button onClick={()=>{const next=!guardrails;setGuardrails(next);if(next)setPricePct(p=>Math.min(GR_MAX,Math.max(GR_MIN,p)));}} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
          <div style={{width:36,height:20,borderRadius:10,background:guardrails?"#00967a":"#ddd",position:"relative",transition:"background .3s",boxShadow:"inset 0 1px 3px rgba(0,0,0,.15)"}}>
            <div style={{position:"absolute",top:2,left:guardrails?17:2,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.25)",transition:"left .25s"}}/>
          </div>
        </button>
      </div>
      {!guardrails&&(pricePct<GR_MIN||pricePct>GR_MAX)&&<div style={{fontSize:9,color:MARS.red,fontFamily:"'MarsBold',system-ui",background:"#fff1f0",borderRadius:5,padding:"3px 8px",marginTop:4,textAlign:"center"}}>⚠ Outside guardrail limits ({pricePct<GR_MIN?`below ${GR_MIN}%`:`above +${GR_MAX}%`})</div>}
      <div style={{fontSize:10,color:"#8b8fb8",padding:"6px 0 2px",display:"flex",justifyContent:"space-between"}}>
        <span>Effective elasticity for {CH_NAMES[channel]}:</span>
        <span style={{fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>{e}</span>
      </div>
      <div style={{background:`linear-gradient(135deg,${MARS.blue},#0000c8)`,borderRadius:12,padding:14,color:"#fff",textAlign:"center",marginTop:10}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".05em"}}>Projected Revenue Impact</div>
        <div style={{fontSize:26,fontFamily:"'MarsExtrabold',system-ui",color:"#fff",margin:"4px 0"}}>{revDelta>=0?"+":"-"}${revM}M</div>
        <div style={{display:"flex",justifyContent:"space-around",marginTop:10}}><MV val={volDelta} label="Volume Δ"/><MV val={revDelta} label="Revenue Δ"/><MV val={mgnDelta} label="Margin Δ"/></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <button onClick={handleAddScenario} style={{flex:1,padding:"9px",borderRadius:8,background:flash?"#00967a":MARS.blue,color:"#fff",fontFamily:"'MarsBold',system-ui",fontSize:11,border:"none",cursor:"pointer",transition:"background .3s"}}>{flash?"✓ Saved!":"+ Add to Scenario"}</button>
        <button onClick={()=>setShowCart(true)} style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${MARS.blue}30`,background:`${MARS.blue}08`,color:MARS.blue,fontFamily:"'MarsBold',system-ui",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          Cart {scenarios.length>0&&<span style={{background:MARS.blue,color:"#fff",borderRadius:20,padding:"0px 5px",fontSize:9}}>{scenarios.length}</span>}
        </button>
      </div>
    </div>
  );
}

// ─── DEMAND CURVE — FULLY FILTER-SYNCED ──────────────────────────────────────
// Per-brand config: price range, base volume, elasticity
const BRAND_CURVE_CONFIG = {
  Snickers:  { priceMin:1.09, priceMax:2.29, priceStep:0.12, baseVol:180, elasticity:-1.86, defaultCur:1.79 },
  "M&M's":   { priceMin:1.19, priceMax:2.39, priceStep:0.12, baseVol:160, elasticity:-1.94, defaultCur:1.89 },
  Twix:      { priceMin:1.19, priceMax:2.39, priceStep:0.12, baseVol:150, elasticity:-2.08, defaultCur:1.89 },
  Skittles:  { priceMin:0.99, priceMax:2.09, priceStep:0.11, baseVol:170, elasticity:-1.71, defaultCur:1.59 },
  Starburst: { priceMin:0.99, priceMax:2.09, priceStep:0.11, baseVol:155, elasticity:-1.64, defaultCur:1.59 },
};

// Detect brand from SKU name
function detectBrandFromSKU(sku) {
  const s = (sku || "").toLowerCase();
  if (s.includes("snickers"))  return "Snickers";
  if (s.includes("m&m") || s.includes("mms") || s.includes("m&ms")) return "M&M's";
  if (s.includes("twix"))      return "Twix";
  if (s.includes("skittles"))  return "Skittles";
  if (s.includes("starburst")) return "Starburst";
  return "Snickers"; // fallback
}

function DemandCurveChart({ filters, w, h }) {
  // Detect brand from SKU filter
  const brand  = detectBrandFromSKU(filters.SKU);
  const cfg    = BRAND_CURVE_CONFIG[brand] || BRAND_CURVE_CONFIG.Snickers;

  // Build seeded hash from ALL relevant filters
  const s = hash(`demand-${brand}-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Retailer}-${filters.Category}`);

  // Vary base volume by market + retailer
  const baseVol = vary(cfg.baseVol, s+1, 0.22);

  // Vary current price slightly by market/period
  const cur = parseFloat(vary(cfg.defaultCur, s+2, 0.06).toFixed(2));

  // Period shifts elasticity slightly (seasonal demand sensitivity)
  const periodIdx   = parseInt((filters.Period || "P1").replace("P","")) || 1;
  const periodShift = 1.0 + (periodIdx - 7) * 0.008; // P7 = neutral; Q4 periods more elastic
  const e           = parseFloat((cfg.elasticity * periodShift * vary(1, s+3, 0.06)).toFixed(3));

  // Build price array from brand config
  const steps  = Math.round((cfg.priceMax - cfg.priceMin) / cfg.priceStep);
  const prices = Array.from({ length: steps + 1 }, (_, i) =>
    parseFloat((cfg.priceMin + i * cfg.priceStep).toFixed(2))
  );

  const data = prices.map(p => ({
    price:     p,
    vol:       Math.round(baseVol * Math.pow(cur / p, Math.abs(e))),
    isCurrent: Math.abs(p - cur) < cfg.priceStep * 0.6,
  }));

  return (
    <LineChart width={w} height={h} data={data} margin={{ top:10, right:20, left:0, bottom:20 }}>
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4"/>
      <XAxis dataKey="price" tickFormatter={v=>`$${v}`} tick={{ fontSize:10, fill:"#8b8fb8" }} axisLine={{ stroke:"#e0e0f0" }} tickLine={false}
        label={{ value:"Price ($)", position:"insideBottom", offset:-10, fontSize:10, fill:"#8b8fb8" }}/>
      <YAxis tick={{ fontSize:10, fill:"#8b8fb8" }} axisLine={false} tickLine={false}
        label={{ value:"Volume (K units)", angle:-90, position:"insideLeft", offset:14, fontSize:10, fill:"#8b8fb8" }}/>
      <Tooltip
        formatter={(v) => [v.toLocaleString() + " K", "Volume"]}
        contentStyle={{ fontSize:12, borderRadius:8 }}
        labelFormatter={v => `Price: $${v}`}
      />
      <ReferenceLine x={cur} stroke={MARS.red} strokeDasharray="5 3"
        label={{ value:`$${cur} (Current)`, position:"top", fontSize:9, fill:MARS.red }}/>
      <Line type="monotone" dataKey="vol" stroke={MARS.red} strokeWidth={2.5}
        dot={(p) => {
          const { cx, cy, payload:pl } = p;
          if (pl.isCurrent) return <circle key="c" cx={cx} cy={cy} r={6} fill={MARS.red} stroke="#fff" strokeWidth={2}/>;
          return <g key={`g${pl.price}`}/>;
        }}/>
    </LineChart>
  );
}

// Helper to build the dynamic demand curve title
function demandCurveTitle(filters) {
  const brand = detectBrandFromSKU(filters.SKU);
  const sku   = filters.SKU || brand;
  return `Demand Curve · ${sku} · ${filters.Market}`;
}

// ─── COMPETITIVE PRICE CHART ──────────────────────────────────────────────────
function CompPriceChart({ filters, w, h }) {
  const s=hash(`comp-${filters.Market}-${filters.Period}`);
  const data=[{name:"Snickers",price:vary(1.79,s+1,0.06),ours:true},{name:"Reese's",price:vary(1.69,s+2,0.06),ours:false},{name:"Kit Kat",price:vary(1.79,s+3,0.06),ours:false},{name:"Hershey's",price:vary(1.59,s+4,0.06),ours:false},{name:"Twix",price:vary(1.89,s+5,0.06),ours:true},{name:"Baby Ruth",price:vary(1.49,s+6,0.06),ours:false}];
  return(
    <BarChart width={w} height={h} data={data} margin={{top:10,right:20,left:0,bottom:20}}>
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4"/>
      <XAxis dataKey="name" tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={{stroke:"#e0e0f0"}} tickLine={false}/>
      <YAxis domain={[1.2,2.1]} tickFormatter={v=>`$${v.toFixed(2)}`} tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={false} tickLine={false}/>
      <Tooltip formatter={(v)=>[`$${v.toFixed(2)}`,"Price"]} contentStyle={{fontSize:12,borderRadius:8}}/>
      <Bar dataKey="price" radius={[5,5,0,0]}>{data.map((d,i)=><Cell key={i} fill={d.ours?MARS.blue:"rgba(0,0,0,.12)"}/>)}</Bar>
    </BarChart>
  );
}

// ─── PRICE WATERFALL TABLE ────────────────────────────────────────────────────
function PriceWaterfallTable({ filters }) {
  const s=hash(`pwf-${filters.Market}-${filters.Period}-${filters.Year}`);
  const rows=[
    {brand:"Snickers 1.86oz",    list:1.79,trade:-0.12,promo:-0.08,oi:-0.02,target:87},
    {brand:"M&M's Peanut 1.74oz",list:1.89,trade:-0.14,promo:-0.11,oi:-0.03,target:87},
    {brand:"Twix 1.79oz",        list:1.89,trade:-0.18,promo:-0.14,oi:-0.04,target:86},
    {brand:"Skittles 2.17oz",    list:1.59,trade:-0.10,promo:-0.07,oi:-0.01,target:88},
    {brand:"Starburst 2.07oz",   list:1.59,trade:-0.11,promo:-0.09,oi:-0.02,target:87},
  ].map((r,i)=>{
    const list=vary(r.list,s+i,0.06),trade=vary(r.trade,s+i+10,0.15),promo=vary(r.promo,s+i+20,0.15),oi=vary(r.oi,s+i+30,0.10);
    const net=parseFloat((list+trade+promo+oi).toFixed(2)),real=parseFloat(((net/list)*100).toFixed(1));
    const status=real>=r.target?"green":real>=r.target-2?"gold":"red";
    return{...r,list,trade,promo,oi,net,real,status};
  });
  const th={padding:"8px 10px",textAlign:"left",fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".06em",background:"#f8f8fc",borderBottom:"2px solid #e8e8f4",whiteSpace:"nowrap"};
  const td={padding:"9px 10px",fontSize:12,borderBottom:"1px solid #f0f0f8"};
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Brand","List Price","Trade Allow.","Promo Disc.","OI Deduct.","Net Price","Realization %","vs Target","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=>(
          <tr key={i} onMouseOver={e=>e.currentTarget.style.background="#fafbfc"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
            <td style={{...td,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>{r.brand}</td>
            <td style={td}>${r.list.toFixed(2)}</td>
            <td style={{...td,color:MARS.red}}>-${Math.abs(r.trade).toFixed(2)}</td>
            <td style={{...td,color:MARS.red}}>-${Math.abs(r.promo).toFixed(2)}</td>
            <td style={{...td,color:MARS.red}}>-${Math.abs(r.oi).toFixed(2)}</td>
            <td style={{...td,fontFamily:"'MarsBold',system-ui"}}>${r.net.toFixed(2)}</td>
            <td style={td}>{r.real}%</td>
            <td style={td}><Badge type={r.status}>{r.status==="green"?"On Track":r.status==="gold"?"Review":"Below Target"}</Badge></td>
            <td style={td}><button style={{padding:"3px 10px",borderRadius:6,border:"1px solid #e8e8f4",background:r.status==="red"?MARS.red:"#fff",color:r.status==="red"?"#fff":"#1a1a2e",fontSize:10,fontFamily:"'MarsBold',system-ui",cursor:"pointer"}} onClick={()=>alert(`Optimization model for ${r.brand}\nCurrent realization: ${r.real}%\nOpportunity: ${(r.target-r.real).toFixed(1)}pp gap`)}>{r.status==="red"?"Action !":"Optimize"}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PricingAndPack() {
  const { filters } = useFilters();
  const [expanded, setExpanded] = useState(null);
  const sub = `${filters.Market} · ${filters.Period} ${filters.Year}`;

  const s = hash(`kpi-pp-${filters.Market}-${filters.Period}-${filters.Year}`);
  const kpis = [
    { label:"Avg Price Elasticity",  value:`-${vary(1.82,s+1,0.10).toFixed(2)}`, changeLabel:"▼ Steeper vs YA",    sub:"Consumer price sensitivity rising", change:-1 },
    { label:"Price Realization",     value:`${vary(96.2,s+2,0.06).toFixed(1)}%`, changeLabel:`▲ +${vary(0.4,s+3,0.5).toFixed(1)}pp vs Q1`, sub:"List to net price efficiency", change:1 },
    { label:"Optimal Price Gap",     value:`+$${vary(0.08,s+4,0.30).toFixed(2)}`, changeLabel:"vs Competitive",    sub:"Premium justified · Monitor Twix", change:1 },
    { label:"Revenue Opportunity",   value:`+$${Math.round(vary(34,s+5,0.25))}M`, changeLabel:"From price optim.", sub:"If elasticity model applied", change:1 },
  ];

  // Dynamic demand curve title
  const dcTitle = demandCurveTitle(filters);
  const dcSubtitle = `Price vs Volume · ${detectBrandFromSKU(filters.SKU)} · Log-log model · ${sub}`;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#f0f2f8", overflow:"hidden", minWidth:0, minHeight:0 }}>

      {/* Modals */}
      {expanded==="matrix"    && <Modal title="Price Elasticity Matrix — Brand × Channel" subtitle={`Log-log regression model · ${sub}`} onClose={()=>setExpanded(null)}><ElasticityMatrix filters={filters}/></Modal>}
      {expanded==="simulator" && <Modal title="Price Simulator" subtitle="Model revenue & margin impact" onClose={()=>setExpanded(null)}><div style={{maxWidth:500,margin:"0 auto"}}><PriceSimulator filters={filters}/></div></Modal>}
      {expanded==="demand"    && <Modal title={dcTitle} subtitle={dcSubtitle} onClose={()=>setExpanded(null)}><ChartBox height={460}>{(w,h)=><DemandCurveChart filters={filters} w={w} h={h}/>}</ChartBox></Modal>}
      {expanded==="comp"      && <Modal title="Competitive Price Positioning" subtitle={`Current price vs competitors · ${sub}`} onClose={()=>setExpanded(null)}><ChartBox height={460}>{(w,h)=><CompPriceChart filters={filters} w={w} h={h}/>}</ChartBox></Modal>}
      {expanded==="waterfall" && <Modal title="Net Price Realization" subtitle={`List to Net price realization · ${sub}`} onClose={()=>setExpanded(null)}><PriceWaterfallTable filters={filters}/></Modal>}

      {/* Page header */}
      <div style={{ padding:"14px 20px 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:4, height:20, background:MARS.yellow, borderRadius:2 }}/>
          <span style={{ fontFamily:"'MarsExtrabold',system-ui", fontSize:15, color:MARS.blue }}>Pricing Strategy</span>
          <span style={{ fontSize:11, color:"#8b8fb8" }}>Workspace · {filters.Market} · {filters.Period} {filters.Year}</span>
        </div>
        <InsightBox type="info" title="🎯 Key Decision">
          What is the price elasticity for each Mars brand/SKU by channel and retailer, and are current prices at the optimal point on the demand curve?
        </InsightBox>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:14 }}>

        {/* KPI row */}
        <div style={{ display:"flex", gap:10 }}>
          {kpis.map((k,i) => <KPICard key={i} {...k} />)}
        </div>

        {/* Row 1: Elasticity Matrix + Simulator */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
          <Card style={{ padding:"16px 18px" }}>
            <CardHeader title="Price Elasticity Matrix — Brand × Channel" sub="Log-log regression model · Last 52 weeks · Click cell for detail" onExpand={()=>setExpanded("matrix")}/>
            <ElasticityMatrix filters={filters}/>
          </Card>
          <Card style={{ padding:"16px 18px" }}>
            <CardHeader title="Price Simulator" sub="Model revenue & margin impact" onExpand={()=>setExpanded("simulator")}/>
            <PriceSimulator filters={filters}/>
          </Card>
        </div>

        {/* Row 2: Demand Curve (dynamic title) + Competitive Price */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Card style={{ padding:"16px 18px" }}>
            <CardHeader
              title={dcTitle}
              sub={`Elasticity ${BRAND_CURVE_CONFIG[detectBrandFromSKU(filters.SKU)]?.elasticity ?? -1.86} · ${filters.Period} ${filters.Year}`}
              onExpand={()=>setExpanded("demand")}
            />
            <ChartBox height={210}>{(w,h)=><DemandCurveChart filters={filters} w={w} h={h}/>}</ChartBox>
          </Card>
          <Card style={{ padding:"16px 18px" }}>
            <CardHeader title="Competitive Price Positioning" sub="Current price vs competitors · Mass Channel" onExpand={()=>setExpanded("comp")}/>
            <ChartBox height={210}>{(w,h)=><CompPriceChart filters={filters} w={w} h={h}/>}</ChartBox>
          </Card>
        </div>

        {/* Row 3: Waterfall table */}
        <Card style={{ padding:"16px 18px" }}>
          <CardHeader title="Net Price Realization" sub="List to Net price realization by brand" onExpand={()=>setExpanded("waterfall")}/>
          <PriceWaterfallTable filters={filters}/>
        </Card>

      </div>
    </div>
  );
}