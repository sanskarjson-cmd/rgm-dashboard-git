import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";
import { useFilters } from "../context/FilterContext";
import { MARS } from "../data/mockData";

const C = { bg:"#f0f2f8", card:"#fff", border:"#e8e8f4", label:"#8b8fb8", text:"#1a1a2e", subtext:"#6b6b80", green:"#00967a", yellow:"#d4a017", red:MARS.red };
const roiColor = r => r >= 1.1 ? C.green  : r >= 1 ? C.yellow  : C.red;
const roiBg    = r => r >= 1.1 ? "#e0f7f2": r >= 1 ? "#fef9e7" : "#fff1f0";

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

const hash = s => { let h=5381; for(let i=0;i<s.length;i++) h=(h*33)^s.charCodeAt(i); return Math.abs(h); };
const sr   = seed => { const x=Math.sin(seed+1)*10000; return x-Math.floor(x); };
const vary = (base,seed,range=0.12) => parseFloat((base*(1+(sr(seed)-0.5)*range)).toFixed(3));

const ALL_BRANDS      = ["Snickers","M&M's","Twix","Skittles","Starburst"];
const BRAND_COLORS    = [MARS.blue,MARS.orange,"#00967a","#5500bb",MARS.red];
const MECHANIC_LABELS = ["TPR+Display","Display Only","TPR Only","BOGO","Multipack","Feature Ad","Price Reduction"];
const MECHANIC_OPTIONS= ["TPR+Display","Display Only","TPR Only","BOGO","Multipack","Feature Ad","Price Reduction"];

// Shorter labels for radar axes to prevent overlap
const RADAR_LABELS  = ["ROI","Incr. Vol","Brand Eq.","Low Fwd Buy","Simplicity","Speed"];
const RADAR_COLORS  = [MARS.blue,"#00967a","#5500bb",MARS.red,MARS.orange,"#0077cc","#cc5500"];

const BASE_ROI = {
  "Snickers":  [1.48,1.35,1.22,0.98,1.12,1.31,1.18],
  "M&M's":     [1.41,1.28,1.19,0.87,1.08,1.24,1.11],
  "Twix":      [1.38,1.24,1.14,0.82,1.05,1.19,1.07],
  "Skittles":  [1.31,1.18,1.09,0.76,0.94,1.15,1.02],
  "Starburst": [1.25,1.12,1.04,0.71,0.89,1.10,0.98],
};
const MECHANIC_RADAR = {
  "TPR+Display":     [85,78,72,80,70,65],
  "Display Only":    [72,65,68,85,75,70],
  "TPR Only":        [68,70,60,78,80,78],
  "BOGO":            [45,82,50,30,60,80],
  "Multipack":       [62,72,65,68,55,60],
  "Feature Ad":      [74,68,78,82,65,55],
  "Price Reduction": [55,75,45,50,85,88],
};

function getPromoROI(filters) {
  const s = hash(`promo-roi-${filters.Market}-${filters.Year}-${filters.Period}-${filters.Retailer}`);
  const result = {};
  ALL_BRANDS.forEach((brand, bi) => {
    result[brand] = BASE_ROI[brand].map((base, mi) =>
      parseFloat(vary(base, s + bi * 10 + mi, 0.18).toFixed(2))
    );
  });
  return result;
}

function getPromoKPIs(filters) {
  const s = hash(`promo-kpi-${filters.Market}-${filters.Year}-${filters.Period}-${filters.Retailer}`);
  return {
    activePromos: Math.round(vary(24,   s+1, 0.25)),
    belowBep:     Math.round(vary(3,    s+2, 0.60)),
    avgRoi:       parseFloat(vary(1.18, s+3, 0.12).toFixed(2)),
    roiVsYa:      parseFloat(vary(0.12, s+4, 0.50).toFixed(2)),
    incrVol:      parseFloat(vary(34.2, s+5, 0.12).toFixed(1)),
    incrVsYa:     parseFloat(vary(-2.1, s+6, 0.50).toFixed(1)),
    fwdBuy:       parseFloat(vary(1.31, s+7, 0.10).toFixed(2)),
  };
}

function getActivePromos(filters) {
  const s = hash(`promo-table-${filters.Market}-${filters.Year}-${filters.Period}-${filters.Retailer}`);
  const baseRows = [
    {sku:"Snickers 1.86oz",    retailer:"Walmart",mech:"TPR + Display",depth:"15%",dates:"Jun 1–14", baseVol:142,incrVol:38, baseRoi:1.48,baseFwd:1.12},
    {sku:"M&M's Peanut 1.74oz",retailer:"Kroger", mech:"BOGO",         depth:"50%",dates:"Jun 8–21", baseVol:98, incrVol:22, baseRoi:1.09,baseFwd:1.28},
    {sku:"Skittles 2.17oz",    retailer:"Target", mech:"BOGO",         depth:"50%",dates:"Jun 5–18", baseVol:76, incrVol:11, baseRoi:0.76,baseFwd:1.41},
    {sku:"Twix 1.79oz",        retailer:"Target", mech:"TPR",          depth:"12%",dates:"Jun 1–30", baseVol:64, incrVol:18, baseRoi:1.31,baseFwd:1.10},
    {sku:"Starburst 2.07oz",   retailer:"Walmart",mech:"Multipack",    depth:"20%",dates:"Jun 10–30",baseVol:54, incrVol:8,  baseRoi:0.92,baseFwd:1.35},
    {sku:"Snickers Share Size", retailer:"Costco", mech:"Display",      depth:"0%", dates:"Jun 1–30", baseVol:210,incrVol:44, baseRoi:1.62,baseFwd:1.08},
  ];
  return baseRows.map((r,i)=>{
    const roi    = parseFloat(vary(r.baseRoi,s+i*7,    0.14).toFixed(2));
    const fwd    = parseFloat(vary(r.baseFwd,s+i*7+3,  0.10).toFixed(2));
    const bVol   = Math.round(vary(r.baseVol, s+i*7+5, 0.15));
    const iVol   = Math.round(vary(r.incrVol, s+i*7+6, 0.20));
    const status = roi>=1.1?"Strong":roi>=1.0?"Monitor":"Below BEP";
    return {...r,roi,fwd,bVol,iVol,status};
  });
}

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Card = ({children,style}) => <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 2px 10px rgba(0,0,160,.05)",...style}}>{children}</div>;
const iSt  = {width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:11,color:C.text,background:"#f8f8fc",fontFamily:"inherit",outline:"none"};
const Lbl  = ({children}) => <label style={{display:"block",fontSize:8,fontFamily:"'MarsBold',system-ui",color:C.label,textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>{children}</label>;

function KPI({title,value,sub,badge}){
  return(
    <Card style={{padding:"10px 12px",flex:"1 1 0",minWidth:0,borderTop:"3px solid #5500bb"}}>
      <div style={{fontSize:8,fontFamily:"'MarsBold',system-ui",color:C.label,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{title}</div>
      <div style={{fontSize:18,fontFamily:"'MarsExtrabold',system-ui",color:C.text,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:C.subtext,marginTop:3}}>{sub}</div>}
      {badge&&<span style={{display:"inline-block",marginTop:5,fontSize:9,fontFamily:"'MarsBold',system-ui",color:badge.color,background:badge.bg,borderRadius:20,padding:"1px 7px"}}>{badge.label}</span>}
    </Card>
  );
}

function TH({children}){return <th style={{padding:"7px 9px",textAlign:"left",fontFamily:"'MarsBold',system-ui",color:C.label,fontSize:8,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",background:"#f8f8fc",borderBottom:`2px solid ${C.border}`}}>{children}</th>;}
function TD({children}){return <td style={{padding:"7px 9px",fontSize:10,color:C.text,whiteSpace:"nowrap"}}>{children}</td>;}
function TR({children,i}){return <tr style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":"#f9f9fc"}} onMouseOver={e=>e.currentTarget.style.background=`${MARS.blue}06`} onMouseOut={e=>e.currentTarget.style.background=i%2===0?"#fff":"#f9f9fc"}>{children}</tr>;}

// ─── EXPAND + MODAL ───────────────────────────────────────────────────────────
function ExpandBtn({onClick}){
  return(
    <button onClick={onClick}
      style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${MARS.blue}30`,background:`${MARS.blue}08`,fontSize:10,fontFamily:"'MarsBold',system-ui",color:MARS.blue,cursor:"pointer",transition:"all .15s",flexShrink:0}}
      onMouseOver={e=>{e.currentTarget.style.background=MARS.blue;e.currentTarget.style.color="#fff";}}
      onMouseOut={e=>{e.currentTarget.style.background=`${MARS.blue}08`;e.currentTarget.style.color=MARS.blue;}}>
      ⤢ Expand
    </button>
  );
}
function Modal({title,subtitle,onClose,children}){
  useEffect(()=>{const fn=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);},[onClose]);
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,30,.75)",backdropFilter:"blur(6px)"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:201,width:"min(92vw,1100px)",maxHeight:"88vh",background:"#fff",borderRadius:16,boxShadow:"0 32px 80px rgba(0,0,160,.2)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${MARS.blue},#0000c8)`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`3px solid ${MARS.yellow}`,flexShrink:0}}>
          <div>
            <div style={{fontSize:14,fontFamily:"'MarsBold',system-ui",color:"#fff"}}>{title}</div>
            {subtitle&&<div style={{fontSize:11,color:"rgba(255,255,255,.55)",marginTop:2}}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>{children}</div>
      </div>
    </>
  );
}
function CardHeader({title,sub,onExpand,right}){
  return(
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
      <div>
        <div style={{fontSize:13,fontFamily:"'MarsBold',system-ui",color:C.text}}>{title}</div>
        {sub&&<div style={{fontSize:10,color:C.label,marginTop:2}}>{sub}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:8}}>
        {right}
        <ExpandBtn onClick={onExpand}/>
      </div>
    </div>
  );
}

// ─── MULTI-SELECT DROPDOWN ────────────────────────────────────────────────────
function MultiSelect({label,options,selected,onChange,max,allLabel="All"}){
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[]);
  const toggle = val => {
    if(val==="__all__"){ onChange([]); setOpen(false); return; }
    if(selected.includes(val)) onChange(selected.filter(v=>v!==val));
    else if(!max||selected.length<max) onChange([...selected,val]);
  };
  const display = selected.length===0 ? allLabel : selected.join(", ");
  return(
    <div ref={ref} style={{position:"relative"}}>
      {label && <Lbl>{label}</Lbl>}
      <button onClick={()=>setOpen(v=>!v)}
        style={{...iSt,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 8px"}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:11,color:selected.length?C.text:C.label}}>{display}</span>
        <span style={{fontSize:8,color:C.label,marginLeft:4}}>▾</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,160,.12)",overflow:"hidden",marginTop:2}}>
          <div onClick={()=>toggle("__all__")}
            style={{padding:"7px 10px",fontSize:11,cursor:"pointer",background:selected.length===0?`${MARS.blue}10`:"transparent",color:selected.length===0?MARS.blue:C.text,fontFamily:selected.length===0?"'MarsBold',system-ui":"inherit"}}
            onMouseOver={e=>e.currentTarget.style.background=`${MARS.blue}08`}
            onMouseOut={e=>e.currentTarget.style.background=selected.length===0?`${MARS.blue}10`:"transparent"}>
            {allLabel}
          </div>
          {options.map(o=>{
            const sel=selected.includes(o);
            const disabled=!sel&&max&&selected.length>=max;
            return(
              <div key={o} onClick={()=>!disabled&&toggle(o)}
                style={{padding:"7px 10px",fontSize:11,cursor:disabled?"not-allowed":"pointer",background:sel?`${MARS.blue}10`:"transparent",color:disabled?"#ccc":sel?MARS.blue:C.text,fontFamily:sel?"'MarsBold',system-ui":"inherit",opacity:disabled?0.5:1,display:"flex",alignItems:"center",gap:6}}
                onMouseOver={e=>{if(!disabled)e.currentTarget.style.background=`${MARS.blue}08`;}}
                onMouseOut={e=>e.currentTarget.style.background=sel?`${MARS.blue}10`:"transparent"}>
                <span style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${sel?MARS.blue:"#ccd"}`,background:sel?MARS.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {sel&&<span style={{color:"#fff",fontSize:8}}>✓</span>}
                </span>
                {o}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PROMO ROI CHART ──────────────────────────────────────────────────────────
function PromoRoiChart({selectedBrands,roiData,w,h}){
  const brands = selectedBrands.length===0 ? ALL_BRANDS : selectedBrands;
  const data = MECHANIC_LABELS.map((mech,mi)=>{
    const row={name:mech};
    brands.forEach(b=>{ row[b]=roiData[b]?.[mi]??1.0; });
    return row;
  });
  return(
    <BarChart width={w} height={h} data={data} margin={{top:10,right:16,left:0,bottom:35}}>
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4"/>
      <XAxis dataKey="name" tick={{fontSize:9,fill:"#8b8fb8"}} axisLine={{stroke:"#e0e0f0"}} tickLine={false} angle={-20} textAnchor="end" interval={0}/>
      <YAxis domain={[0.5,1.8]} tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={false} tickLine={false}/>
      <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:10,fontFamily:"'MarsBold',system-ui"}}/>
      {brands.map(b=>(
        <Bar key={b} dataKey={b} fill={BRAND_COLORS[ALL_BRANDS.indexOf(b)]} radius={[4,4,0,0]} barSize={Math.max(8,32/brands.length)}/>
      ))}
    </BarChart>
  );
}

// ─── MECHANIC RADAR CHART — fixed overlap ─────────────────────────────────────
// Key fixes:
// 1. outerRadius reduced to 55% to leave room for labels
// 2. Custom tick renderer wraps long words and offsets outward
// 3. Chart height bumped slightly for breathing room
function MechanicRadarChart({selectedMechanics,w,h}){
  const mechanics = selectedMechanics.length===0 ? ["TPR+Display","BOGO"] : selectedMechanics;
  const data = RADAR_LABELS.map((label,li)=>{
    const row={label};
    mechanics.forEach(m=>{ row[m]=MECHANIC_RADAR[m]?.[li]??50; });
    return row;
  });

  // Custom tick that renders label text further out
  const CustomTick = ({payload,x,y,cx,cy,textAnchor}) => {
    const dx = (x-cx)*0.22;
    const dy = (y-cy)*0.22;
    return(
      <text x={x+dx} y={y+dy} textAnchor={textAnchor} dominantBaseline="central"
        style={{fontSize:9,fill:"#8b8fb8",fontFamily:"'MarsBold',system-ui"}}>
        {payload.value}
      </text>
    );
  };

  return(
    <RadarChart width={w} height={h} data={data} cx="50%" cy="50%" outerRadius="55%">
      <PolarGrid gridType="polygon"/>
      <PolarAngleAxis dataKey="label" tick={<CustomTick/>}/>
      <PolarRadiusAxis angle={90} tick={{fontSize:8,fill:"#bbb"}} domain={[0,100]} tickCount={4}/>
      {mechanics.map(m=>(
        <Radar key={m} name={m} dataKey={m}
          stroke={RADAR_COLORS[MECHANIC_OPTIONS.indexOf(m)%RADAR_COLORS.length]}
          fill={RADAR_COLORS[MECHANIC_OPTIONS.indexOf(m)%RADAR_COLORS.length]}
          fillOpacity={0.14} strokeWidth={2}/>
      ))}
      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:10,fontFamily:"'MarsBold',system-ui"}}/>
      <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
    </RadarChart>
  );
}

// ─── ACTIVE PROMO TRACKER ─────────────────────────────────────────────────────
function ActivePromoTable({rows}){
  const statusStyle={Strong:{bg:"#d4f5e2",color:"#1a7a40"},Monitor:{bg:"#fff3d0",color:"#a07000"},"Below BEP":{bg:"#fde8ec",color:MARS.red}};
  const th={padding:"7px 9px",textAlign:"left",fontFamily:"'MarsBold',system-ui",color:C.label,fontSize:8,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",background:"#f8f8fc",borderBottom:`2px solid ${C.border}`};
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Brand/SKU","Retailer","Mechanic","Depth","Dates","Base Vol","Incr. Vol","Promo ROI","Forward Buy","Status"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=>(
          <TR key={i} i={i}>
            <td style={{padding:"7px 9px",fontSize:11,fontFamily:"'MarsBold',system-ui",color:C.text,whiteSpace:"nowrap"}}>{r.sku}</td>
            <TD>{r.retailer}</TD><TD>{r.mech}</TD><TD>{r.depth}</TD><TD>{r.dates}</TD>
            <TD>{r.bVol.toLocaleString()}K</TD>
            <TD>+{r.iVol.toLocaleString()}K</TD>
            <td style={{padding:"7px 9px"}}><span style={{fontSize:11,fontFamily:"'MarsBold',system-ui",color:roiColor(r.roi)}}>{r.roi.toFixed(2)}x</span></td>
            <td style={{padding:"7px 9px"}}><span style={{fontSize:11,color:r.fwd>1.3?MARS.red:r.fwd>1.2?C.yellow:C.green}}>{r.fwd.toFixed(2)}x</span></td>
            <td style={{padding:"7px 9px"}}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:9,fontFamily:"'MarsBold',system-ui",...statusStyle[r.status]}}>{r.status}</span></td>
          </TR>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── PROMO CALENDAR ───────────────────────────────────────────────────────────
function PromoCalendar({filters}){
  const s = hash(`promo-cal-${filters.Market}-${filters.Year}-${filters.Period}`);
  const rows=[
    {brand:"Snickers", weeks:["TPR","TPR","—","—","Display","Display","—","—"],  colors:["green","green",null,null,"green","green",null,null]},
    {brand:"M&M's",    weeks:["—","—","TPR","TPR","—","—","MPack","MPack"],       colors:[null,null,"green","green",null,null,"blue","blue"]},
    {brand:"Skittles", weeks:["—","Review?","—","—","—","Display","Display","—"],colors:[null,"yellow",null,null,null,"green","green",null]},
    {brand:"Twix",     weeks:["TPR","TPR","TPR","—","—","—","—","—"],            colors:["green","green","green",null,null,null,null,null]},
  ].map((row,ri)=>({
    ...row,
    weeks:  row.weeks.map((w,wi)=>w==="—"?w:sr(s+ri*13+wi)>0.85?"—":w),
    colors: row.colors.map((c,wi)=>!c?c:sr(s+ri*13+wi)>0.85?null:c),
  }));
  const bg={green:"#d4f5e2",yellow:"#fff3d0",blue:"#dde8ff"};
  const co={green:"#1a7a40",yellow:"#a07000",blue:"#1a3c8e"};
  const th={padding:"7px 8px",textAlign:"center",fontSize:9,fontFamily:"'MarsBold',system-ui",color:C.label,textTransform:"uppercase",background:"#f8f8fc",borderBottom:`2px solid ${C.border}`};
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>
          <th style={{...th,textAlign:"left",padding:"7px 10px"}}>Brand</th>
          {[1,2,3,4,5,6,7,8].map(w=><th key={w} style={th}>Wk {w}</th>)}
        </tr></thead>
        <tbody>{rows.map((row,i)=>(
          <tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
            <td style={{padding:"8px 10px",fontSize:11,fontFamily:"'MarsBold',system-ui",color:C.text}}>{row.brand}</td>
            {row.weeks.map((w,j)=>(
              <td key={j} style={{padding:"6px 4px",textAlign:"center"}}>
                {w==="—"
                  ?<span style={{fontSize:10,color:"#ccc"}}>—</span>
                  :<span style={{display:"inline-block",padding:"2px 7px",borderRadius:5,fontSize:10,fontFamily:"'MarsBold',system-ui",background:bg[row.colors[j]]||"#f0f0f8",color:co[row.colors[j]]||"#555"}}>{w}</span>
                }
              </td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PromotionsPage(){
  const { filters } = useFilters();
  const [selectedBrands,    setSelectedBrands]    = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState([]);
  const [expanded,          setExpanded]           = useState(null);

  const kpis      = getPromoKPIs(filters);
  const roiData   = getPromoROI(filters);
  const promoRows = getActivePromos(filters);
  const sub       = `${filters.Market} · ${filters.Period} ${filters.Year}`;

  const bestMechanic = MECHANIC_LABELS[roiData["Snickers"].indexOf(Math.max(...roiData["Snickers"]))];
  const bestRoi      = Math.max(...roiData["Snickers"]).toFixed(2);

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0,minHeight:0,background:C.bg}}>

      {/* Modals */}
      {expanded==="roi"      && <Modal title="Promotion ROI Analysis"  subtitle={`Incremental lift · ${sub}`}           onClose={()=>setExpanded(null)}><ChartBox height={460}>{(w,h)=><PromoRoiChart selectedBrands={selectedBrands} roiData={roiData} w={w} h={h}/>}</ChartBox></Modal>}
      {expanded==="mechanic" && <Modal title="Mechanic Effectiveness"   subtitle={`Radar comparison · ${sub}`}           onClose={()=>setExpanded(null)}><ChartBox height={500}>{(w,h)=><MechanicRadarChart selectedMechanics={selectedMechanics} w={w} h={h}/>}</ChartBox></Modal>}
      {expanded==="tracker"  && <Modal title="Active Promotion Tracker" subtitle={`Current period · All retailers · ${sub}`} onClose={()=>setExpanded(null)}><ActivePromoTable rows={promoRows}/></Modal>}
      {expanded==="calendar" && <Modal title="Promo Calendar Optimizer" subtitle={`Next 8 weeks · ${sub}`}               onClose={()=>setExpanded(null)}><PromoCalendar filters={filters}/></Modal>}

      {/* Page title */}
      <div style={{padding:"12px 20px 10px",flexShrink:0,display:"flex",alignItems:"center",gap:8,background:C.card,borderBottom:`1px solid ${C.border}`}}>
        <div style={{width:4,height:20,background:MARS.yellow,borderRadius:2}}/>
        <span style={{fontFamily:"'MarsExtrabold',system-ui",fontSize:14,color:MARS.blue}}>Promotions</span>
        <span style={{fontSize:11,color:C.label}}>· Promo Optimizer · {sub}</span>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:14}}>

        {/* KPIs */}
        <div style={{display:"flex",gap:8}}>
          <KPI title="Active Promotions"    value={String(kpis.activePromos)} sub={`${filters.Period} ${filters.Year} · ${filters.Retailer}`} badge={{label:`${kpis.belowBep} below breakeven ROI`,color:MARS.red,bg:"#fff1f0"}}/>
          <KPI title="Avg Promo ROI"        value={`${kpis.avgRoi.toFixed(2)}x`} sub={`Target: 1.20x · ${filters.Market}`} badge={{label:`${kpis.roiVsYa>=0?"▲ +":"▼ "}${Math.abs(kpis.roiVsYa).toFixed(2)}x vs YA`,color:kpis.roiVsYa>=0?C.green:MARS.red,bg:kpis.roiVsYa>=0?"#e0f7f2":"#fff1f0"}}/>
          <KPI title="Incremental Volume %" value={`${kpis.incrVol.toFixed(1)}%`} sub={`Base: ${(100-kpis.incrVol).toFixed(1)}% · Promo: ${kpis.incrVol.toFixed(1)}%`} badge={{label:`${kpis.incrVsYa>=0?"▲ +":"▼ "}${Math.abs(kpis.incrVsYa).toFixed(1)}pp vs YA`,color:kpis.incrVsYa>=0?C.green:MARS.red,bg:kpis.incrVsYa>=0?"#e0f7f2":"#fff1f0"}}/>
          <KPI title="Forward Buy Index"    value={`${kpis.fwdBuy.toFixed(2)}x`} sub={`Threshold: 1.20x · ${kpis.fwdBuy>1.2?"⚠ Review":"✓ OK"}`} badge={{label:kpis.fwdBuy>1.3?"▼ Elevated":kpis.fwdBuy>1.2?"▼ Watch":"✓ Normal",color:kpis.fwdBuy>1.2?C.yellow:C.green,bg:kpis.fwdBuy>1.2?"#fef9e7":"#e0f7f2"}}/>
        </div>

        {/* Row 1: ROI Chart + Mechanic Radar */}
        <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:14}}>
          <Card style={{padding:"14px 16px"}}>
            <CardHeader
              title="Promotion ROI Analysis"
              sub={`Incremental lift vs spend · ${filters.Period} ${filters.Year} · ${filters.Market}`}
              onExpand={()=>setExpanded("roi")}
              right={
                <div style={{width:180}}>
                  <MultiSelect
                    options={ALL_BRANDS}
                    selected={selectedBrands}
                    onChange={setSelectedBrands}
                    max={3}
                    allLabel="All Brands"
                  />
                </div>
              }
            />
            <ChartBox height={230}>{(w,h)=><PromoRoiChart selectedBrands={selectedBrands} roiData={roiData} w={w} h={h}/>}</ChartBox>
          </Card>

          <Card style={{padding:"14px 16px"}}>
            <CardHeader
              title="Mechanic Effectiveness"
              sub={`Performance by promo mechanic · ${filters.Market}`}
              onExpand={()=>setExpanded("mechanic")}
              right={
                <div style={{width:180}}>
                  <MultiSelect
                    options={MECHANIC_OPTIONS}
                    selected={selectedMechanics}
                    onChange={setSelectedMechanics}
                    max={2}
                    allLabel="TPR+Display vs BOGO"
                  />
                </div>
              }
            />
            <div style={{fontSize:11,color:C.subtext,background:"#f0f7ff",borderLeft:`3px solid ${MARS.blue}`,borderRadius:"0 6px 6px 0",padding:"7px 10px",marginBottom:8,lineHeight:1.5}}>
              <strong style={{color:MARS.blue,fontSize:10}}>💡 Insight</strong> · In {filters.Market}, <strong>{bestMechanic}</strong> delivers highest ROI ({bestRoi}x). Shift budget to combo mechanics.
            </div>
            {/* Extra height to prevent label clipping */}
            <ChartBox height={220}>{(w,h)=><MechanicRadarChart selectedMechanics={selectedMechanics} w={w} h={h}/>}</ChartBox>
          </Card>
        </div>

        {/* Row 2: Active Promo Tracker */}
        <Card style={{padding:"14px 16px"}}>
          <CardHeader title="Active Promotion Tracker" sub={`${filters.Period} ${filters.Year} · ${filters.Retailer} · ${filters.Market}`} onExpand={()=>setExpanded("tracker")}/>
          <ActivePromoTable rows={promoRows}/>
        </Card>

        {/* Row 3: Promo Calendar */}
        <Card style={{padding:"14px 16px"}}>
          <CardHeader title="Promo Calendar Optimizer" sub={`Recommended schedule — Next 8 weeks · ${filters.Market}`} onExpand={()=>setExpanded("calendar")}/>
          <PromoCalendar filters={filters}/>
        </Card>

      </div>
    </div>
  );
}