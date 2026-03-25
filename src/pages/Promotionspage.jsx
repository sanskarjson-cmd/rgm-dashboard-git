import { useState } from "react";
import { MARS } from "../data/mockData";
import { PROMO_OPTIONS, simulate, BASELINE_DATA, POST_PROMO_DATA, PRE_POST_DATA } from "../data/promoData";

// ─── MODULE-LEVEL HISTORY — persists across tab switches until page refresh ───
let _simHistory = [];
const historyStore = {
  get:   ()     => _simHistory,
  add:   (item) => { _simHistory = [item, ..._simHistory]; },
  remove:(i)    => { _simHistory = _simHistory.filter((_, idx) => idx !== i); },
  clear: ()     => { _simHistory = []; },
};

const C = { bg:"#f0f2f8", card:"#fff", border:"#e8e8f4", label:"#8b8fb8", text:"#1a1a2e", subtext:"#6b6b80", green:"#00967a", yellow:"#d4a017", red:MARS.red };
const roiColor = r => r>=1.1?C.green:r>=1?C.yellow:C.red;
const roiBg    = r => r>=1.1?"#e0f7f2":r>=1?"#fef9e7":"#fff1f0";
const FEMPTY   = { promoName:"", mechanism:"", customer:"", category:"", brand:"", brandTech:"", zrep:"", year:"" };

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Card = ({children,style}) => <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 2px 10px rgba(0,0,160,.05)",...style}}>{children}</div>;
const SecTitle = ({children}) => <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><div style={{width:3,height:13,background:MARS.yellow,borderRadius:2}}/><span style={{fontSize:10,fontFamily:"'MarsBold',system-ui",color:MARS.blue,textTransform:"uppercase",letterSpacing:".06em"}}>{children}</span></div>;
const Lbl = ({children}) => <label style={{display:"block",fontSize:8,fontFamily:"'MarsBold',system-ui",color:C.label,textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>{children}</label>;
const iSt = {width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:11,color:C.text,background:"#f8f8fc",fontFamily:"inherit",outline:"none"};

function Inp({label,type="text",value,onChange,placeholder}){
  return(<div><Lbl>{label}</Lbl><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={iSt} onFocus={e=>e.target.style.borderColor=MARS.blue} onBlur={e=>e.target.style.borderColor=C.border}/></div>);
}
function Sel({label,value,onChange,options}){
  return(<div><Lbl>{label}</Lbl><select value={value} onChange={e=>onChange(e.target.value)} style={{...iSt,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5 4.5-5z' fill='%238b8fb8'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center",paddingRight:24,cursor:"pointer"}}><option value="">Select…</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>);
}
function KPI({title,value,sub,color,badge}){
  return(<Card style={{padding:"10px 12px",flex:"1 1 0",minWidth:0,borderTop:"3px solid #5500bb"}}><div style={{fontSize:8,fontFamily:"'MarsBold',system-ui",color:C.label,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{title}</div><div style={{fontSize:18,fontFamily:"'MarsExtrabold',system-ui",color:C.text,lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:10,color:C.subtext,marginTop:3}}>{sub}</div>}{badge&&<span style={{display:"inline-block",marginTop:5,fontSize:9,fontFamily:"'MarsBold',system-ui",color:badge.color,background:badge.bg,borderRadius:20,padding:"1px 7px"}}>{badge.label}</span>}</Card>);
}
function Btn({children,onClick,variant="primary",small}){
  const v={primary:{background:MARS.blue,color:"#fff",border:"none"},secondary:{background:"#fff",color:MARS.blue,border:`1px solid ${MARS.blue}30`},danger:{background:"#fff1f0",color:C.red,border:`1px solid ${C.red}30`}}[variant];
  return(<button onClick={onClick} style={{...v,padding:small?"3px 9px":"7px 16px",borderRadius:6,fontSize:small?10:11,fontFamily:"'MarsBold',system-ui",cursor:"pointer",whiteSpace:"nowrap"}} onMouseOver={e=>e.currentTarget.style.opacity=".8"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>{children}</button>);
}
function TH({children}){return <th style={{padding:"7px 9px",textAlign:"left",fontFamily:"'MarsBold',system-ui",color:C.label,fontSize:8,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",background:"#f8f8fc",borderBottom:`2px solid ${C.border}`}}>{children}</th>;}
function TD({children,mono}){return <td style={{padding:"7px 9px",fontSize:10,color:mono?C.subtext:C.text,whiteSpace:"nowrap"}}>{children}</td>;}
function TR({children,i}){return <tr style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":"#f9f9fc"}} onMouseOver={e=>e.currentTarget.style.background=`${MARS.blue}06`} onMouseOut={e=>e.currentTarget.style.background=i%2===0?"#fff":"#f9f9fc"}>{children}</tr>;}
function DlBtn({data,filename}){
  const dl=()=>{if(!data?.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(","),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=filename||"export.csv";a.click();};
  return <Btn onClick={dl} variant="secondary" small>↓ CSV</Btn>;
}
function TabBar({tabs,active,onChange}){
  return(<div style={{display:"inline-flex",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:3,gap:2}}>{tabs.map(t=>{const on=t===active;return(<button key={t} onClick={()=>onChange(t)} style={{padding:"7px 20px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontFamily:on?"'MarsBold',system-ui":"inherit",color:on?"#fff":C.subtext,background:on?MARS.blue:"transparent",transition:"all .2s",whiteSpace:"nowrap"}}>{t}</button>);})}</div>);
}

// ─── FILTER SIDEBAR — full height, scrollable fields, pinned buttons ──────────
function FilterSidebar({filters,setFilters,onApply,onReset}){
  const fields=[
    {key:"promoName",label:"Promo Name",    opts:null},
    {key:"mechanism",label:"Mechanism",      opts:PROMO_OPTIONS.mechanisms},
    {key:"customer", label:"Customer",       opts:PROMO_OPTIONS.customers},
    {key:"category", label:"Category",       opts:PROMO_OPTIONS.categories},
    {key:"brand",    label:"Brand",          opts:PROMO_OPTIONS.brands},
    {key:"brandTech",label:"Brand Tech",     opts:PROMO_OPTIONS.brandTechs},
    {key:"zrep",     label:"ZREP",           opts:PROMO_OPTIONS.zreps},
    {key:"year",     label:"Year",           opts:PROMO_OPTIONS.years},
  ];
  return(
    <div style={{
      width:180, flexShrink:0,
      background:C.card, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column",
      height:"100%", minHeight:0, overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{padding:"10px 10px 6px",flexShrink:0,borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",color:MARS.blue,textTransform:"uppercase",letterSpacing:".1em"}}>Filters</div>
      </div>
      {/* Fields — scroll internally */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 10px",display:"flex",flexDirection:"column",gap:7,minHeight:0}}>
        {fields.map(f=>f.opts
          ?<Sel key={f.key} label={f.label} value={filters[f.key]||""} onChange={v=>setFilters(p=>({...p,[f.key]:v}))} options={f.opts}/>
          :<Inp key={f.key} label={f.label} value={filters[f.key]||""} onChange={v=>setFilters(p=>({...p,[f.key]:v}))} placeholder="Search…"/>
        )}
      </div>
      {/* Buttons — always at bottom */}
      <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,display:"flex",gap:6,flexShrink:0}}>
        <Btn onClick={onApply} small>Apply</Btn>
        <Btn onClick={onReset} variant="secondary" small>Reset</Btn>
      </div>
    </div>
  );
}

// ─── PROMO SIMULATOR ──────────────────────────────────────────────────────────
function PromoSimulatorTab({subTab}){
  return(
    <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {subTab==="Simulator"&&<SimulatorSubTab/>}
      {subTab==="Baseline Data"&&<BaselineSubTab/>}
    </div>
  );
}

function SimulatorSubTab(){
  const EMPTY={promoName:"",country:"",customer:"",mechanism:"",startDate:"",endDate:"",brand:"",sku:"",brandTech:"",budget:""};
  const [form,setForm]=useState(EMPTY);
  const [output,setOutput]=useState(null);
  const [history,setHistory]=useState(historyStore.get());
  const set=k=>v=>setForm(f=>({...f,[k]:v}));
  const handleSim=()=>{
    if(!form.sku||!form.mechanism)return;
    const r=simulate(form);
    historyStore.add(r);
    setOutput(r);
    setHistory([...historyStore.get()]);
  };
  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:14}}>
      <Card style={{padding:"14px 16px"}}>
        <SecTitle>Input Parameters</SecTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px 12px"}}>
          <Inp label="Promo Name"   value={form.promoName} onChange={set("promoName")} placeholder="e.g. Easter BOGOF"/>
          <Sel label="Country"      value={form.country}   onChange={set("country")}   options={PROMO_OPTIONS.countries}/>
          <Sel label="Customer"     value={form.customer}  onChange={set("customer")}  options={PROMO_OPTIONS.customers}/>
          <Sel label="Mechanism"    value={form.mechanism} onChange={set("mechanism")} options={PROMO_OPTIONS.mechanisms}/>
          <Inp label="Start Date"   type="date" value={form.startDate} onChange={set("startDate")}/>
          <Inp label="End Date"     type="date" value={form.endDate}   onChange={set("endDate")}/>
          <Sel label="Brand"        value={form.brand}     onChange={set("brand")}     options={PROMO_OPTIONS.brands}/>
          <Sel label="SKU"          value={form.sku}       onChange={set("sku")}       options={PROMO_OPTIONS.skus}/>
          <Sel label="Brand Tech"   value={form.brandTech} onChange={set("brandTech")} options={PROMO_OPTIONS.brandTechs}/>
          <Inp label="Budget (€)"   type="number" value={form.budget} onChange={set("budget")} placeholder="5000"/>
        </div>
        <div style={{marginTop:12}}><Btn onClick={handleSim}>Simulate</Btn></div>
      </Card>

      {output&&(
        <Card style={{padding:"14px 16px"}}>
          <SecTitle>Simulated Output</SecTitle>
          <div style={{display:"flex",gap:8}}>
            <KPI title="Baseline Volume"       value={`${output.baseVol.toLocaleString()} cs`} color={"#5500bb"}/>
            <KPI title="Baseline Revenue"      value={`€${output.baseRev.toLocaleString()}`}   color="#5500bb"/>
            <KPI title="Volume Uplift"         value={`+${output.upliftPct}%`} color={C.green} badge={{label:`+${(output.projVol-output.baseVol).toLocaleString()} cs`,color:C.green,bg:"#e0f7f2"}}/>
            <KPI title="Projected Revenue"     value={`€${output.projRev.toLocaleString()}`}   color={"#5500bb"}/>
            <KPI title="ROI vs Category ROI"   value={output.roi.toFixed(2)} sub={`Cat: ${output.catRoi.toFixed(2)}`} color={roiColor(output.roi)} badge={{label:output.roi>=1.1?"Above Target":output.roi>=1?"At Target":"Below Target",color:roiColor(output.roi),bg:roiBg(output.roi)}}/>
            <KPI title="MAC vs Last Promo"     value={`€${output.mac.toLocaleString()}`} sub={`Last: €${output.lastMac.toLocaleString()}`} color={"#5500bb"} badge={{label:output.mac>output.lastMac?`+€${(output.mac-output.lastMac).toLocaleString()}`:`-€${(output.lastMac-output.mac).toLocaleString()}`,color:output.mac>output.lastMac?C.green:C.red,bg:output.mac>output.lastMac?"#e0f7f2":"#fff1f0"}}/>
          </div>
        </Card>
      )}

      <Card style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <SecTitle>Simulation History</SecTitle>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:10,color:C.subtext}}>{history.length} run{history.length!==1?"s":""}</span>
            {history.length>0&&<DlBtn data={history} filename="simulation_history.csv"/>}
            {history.length>0&&<Btn small variant="danger" onClick={()=>{historyStore.clear();setHistory([]);}}>Clear All</Btn>}
          </div>
        </div>
        {history.length===0
          ?<div style={{textAlign:"center",padding:"28px 0",color:C.label,fontSize:12}}>No simulations yet. Fill the form above and click <strong>Simulate</strong>.</div>
          :<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Runtime","Promo Name","Country","Customer","Mechanism","Start","End","Brand","SKU","Brand Tech","Base Vol","Base Rev","Proj Rev","Uplift","MAC","ROI","Actions"].map(h=><TH key={h}>{h}</TH>)}</tr></thead><tbody>{history.map((r,i)=>(<TR key={i} i={i}><TD mono>{r.runtime}</TD><TD>{r.promoName||"—"}</TD><TD>{r.country||"—"}</TD><TD>{r.customer||"—"}</TD><TD>{r.mechanism}</TD><TD>{r.startDate||"—"}</TD><TD>{r.endDate||"—"}</TD><TD>{r.brand||"—"}</TD><TD>{r.sku}</TD><TD>{r.brandTech||"—"}</TD><TD>{r.baseVol.toLocaleString()}</TD><TD>€{r.baseRev.toLocaleString()}</TD><TD>€{r.projRev.toLocaleString()}</TD><TD>+{r.upliftPct}%</TD><TD>€{r.mac.toLocaleString()}</TD><td style={{padding:"7px 9px"}}><span style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontFamily:"'MarsBold',system-ui",color:roiColor(r.roi),background:roiBg(r.roi)}}>{r.roi.toFixed(2)}</span></td><td style={{padding:"7px 9px"}}><div style={{display:"flex",gap:4}}><Btn small onClick={()=>setForm({promoName:r.promoName,country:r.country,customer:r.customer,mechanism:r.mechanism,startDate:r.startDate,endDate:r.endDate,brand:r.brand,sku:r.sku,brandTech:r.brandTech,budget:r.budget})}>↺</Btn><Btn small variant="danger" onClick={()=>{historyStore.remove(i);setHistory([...historyStore.get()]);} }>✕</Btn></div></td></TR>))}</tbody></table></div>
        }
      </Card>
    </div>
  );
}

function BaselineSubTab(){
  const [data,setData]=useState(BASELINE_DATA.map((r,i)=>({...r,id:i})));
  const [editing,setEditing]=useState(null);
  const del=id=>setData(d=>d.filter(r=>r.id!==id));
  const save=row=>{setData(d=>d.map(r=>r.id===row.id?row:r));setEditing(null);};
  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>
      <Card style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <SecTitle>Baseline Data</SecTitle><DlBtn data={data} filename="baseline_data.csv"/>
        </div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["SKU","Customer","Brand","Seasonality","Date","Forecast (Units)","Actions"].map(h=><TH key={h}>{h}</TH>)}</tr></thead><tbody>{data.map((row,i)=>editing===row.id?(<tr key={row.id} style={{background:`${MARS.blue}06`}}>{["sku","customer","brand","seasonality","date","forecast"].map(k=>(<td key={k} style={{padding:"5px 7px"}}><input defaultValue={row[k]} id={`e-${row.id}-${k}`} style={{...iSt,padding:"4px 7px",fontSize:10}}/></td>))}<td style={{padding:"5px 7px"}}><div style={{display:"flex",gap:4}}><Btn small onClick={()=>{const u={...row};["sku","customer","brand","seasonality","date","forecast"].forEach(k=>{u[k]=document.getElementById(`e-${row.id}-${k}`)?.value||row[k];});save(u);}}>Save</Btn><Btn small variant="secondary" onClick={()=>setEditing(null)}>Cancel</Btn></div></td></tr>):(<TR key={row.id} i={i}><TD>{row.sku}</TD><TD>{row.customer}</TD><TD>{row.brand}</TD><TD>{row.seasonality}</TD><TD>{row.date}</TD><TD>{row.forecast.toLocaleString()}</TD><td style={{padding:"7px 9px"}}><div style={{display:"flex",gap:4}}><Btn small variant="secondary" onClick={()=>setEditing(row.id)}>Edit</Btn><Btn small variant="danger" onClick={()=>del(row.id)}>Delete</Btn></div></td></TR>))}</tbody></table></div>
      </Card>
    </div>
  );
}

// ─── POST PROMO content (no own filter — filter is in parent) ─────────────────
function PostPromoContent({applied}){
  const data=POST_PROMO_DATA.filter(r=>(!applied.mechanism||r.mechanism===applied.mechanism)&&(!applied.customer||r.customer===applied.customer)&&(!applied.brand||r.brand===applied.brand));
  const totalRev=data.reduce((s,r)=>s+r.mac,0);
  const totalAll=POST_PROMO_DATA.reduce((s,r)=>s+r.mac,0);
  const above=data.filter(r=>r.roi>=1).length;
  const medRoi=[...data].sort((a,b)=>a.roi-b.roi)[Math.floor(data.length/2)]?.roi||0;
  const avgUp=data.length?parseFloat((data.reduce((s,r)=>s+((r.salesQty-r.baseUnits)/r.baseUnits*100),0)/data.length).toFixed(1)):0;
  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8}}>
        <KPI title="Total Incremental Revenue" value={`€${totalRev.toLocaleString()}`} sub={`Total: €${totalAll.toLocaleString()}`} color={"#5500bb"}/>
        <KPI title="Promos Above Breakeven"    value={`${above} / ${data.length}`}     sub={`${data.length?Math.round(above/data.length*100):0}%`} color={C.green}/>
        <KPI title="Median ROI"                value={medRoi.toFixed(2)} color={roiColor(medRoi)} badge={{label:medRoi>=1.1?"Above":medRoi>=1?"At Target":"Below",color:roiColor(medRoi),bg:roiBg(medRoi)}}/>
        <KPI title="Average Uplift"            value={`${avgUp}%`} color={"#5500bb"}/>
      </div>
      <Card style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <SecTitle>Actual Overview</SecTitle><DlBtn data={data} filename="post_promo_actual.csv"/>
        </div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["SKU","Brand","Product","Customer","Mechanism","Start","End","Base Units","Sales Qty","Promo Cost","MAC","ROI"].map(h=><TH key={h}>{h}</TH>)}</tr></thead><tbody>{data.map((r,i)=>(<TR key={i} i={i}><TD>{r.sku}</TD><TD>{r.brand}</TD><TD>{r.product}</TD><TD>{r.customer}</TD><TD>{r.mechanism}</TD><TD>{r.start}</TD><TD>{r.end}</TD><TD>{r.baseUnits.toLocaleString()}</TD><TD>{r.salesQty.toLocaleString()}</TD><TD>€{r.promoCost.toLocaleString()}</TD><TD>€{r.mac.toLocaleString()}</TD><td style={{padding:"7px 9px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,fontSize:9,fontFamily:"'MarsBold',system-ui",color:roiColor(r.roi),background:roiBg(r.roi)}}><span style={{width:5,height:5,borderRadius:"50%",background:roiColor(r.roi)}}/>{r.roi.toFixed(2)}</span></td></TR>))}</tbody></table></div>
      </Card>
    </div>
  );
}

// ─── PRE VS POST content (no own filter) ─────────────────────────────────────
function PrePostContent({applied}){
  const data=PRE_POST_DATA.filter(r=>(!applied.mechanism||r.mechanism===applied.mechanism)&&(!applied.customer||r.customer===applied.customer)&&(!applied.brand||r.brand===applied.brand));
  const planAcc=data.length?parseFloat((data.reduce((s,r)=>s+(1-Math.abs(r.roiVar)/Math.max(r.preRoi,0.01)),0)/data.length*100).toFixed(1)):0;
  const avgVar=data.length?parseFloat((data.reduce((s,r)=>s+Math.abs(r.roiVar),0)/data.length).toFixed(2)):0;
  const volAcc=data.length?parseFloat((data.reduce((s,r)=>s+(1-Math.abs(r.volVar)/Math.max(r.preVol,1)),0)/data.length*100).toFixed(1)):0;
  const aboveBE=data.filter(r=>r.postRoi>=1).length;
  // Base info column header
  const BH=({l})=><th rowSpan={2} style={{padding:"8px 10px",textAlign:"left",fontFamily:"'MarsBold',system-ui",color:C.label,fontSize:8,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",background:"#f4f4fc",borderBottom:`2px solid ${C.border}`,verticalAlign:"bottom"}}>{l}</th>;
  // Group header spanning 3 sub-columns
  const GH=({l,color})=><th colSpan={3} style={{padding:"8px 10px",textAlign:"center",fontFamily:"'MarsBold',system-ui",color:color||"#fff",fontSize:9,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",background:color?`${color}18`:MARS.blue,borderBottom:`1px solid ${C.border}`,borderLeft:`1px solid ${C.border}30`,borderRadius:0}}>{l}</th>;
  // Sub-column header
  const SH=({l,last})=><th style={{padding:"6px 10px",textAlign:"left",fontFamily:"'MarsBold',system-ui",color:C.label,fontSize:8,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",background:"#f8f8fc",borderBottom:`2px solid ${C.border}`,borderLeft:last?"none":`1px solid ${C.border}20`}}>{l}</th>;
  const VC=({val})=><td style={{padding:"7px 9px",fontSize:10,fontFamily:"'MarsBold',system-ui",color:val>=0?C.green:C.red,whiteSpace:"nowrap"}}>{val>=0?"+":""}{val}</td>;
  return(
    <div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8}}>
        <KPI title="Planning Accuracy (ROI)" value={`${planAcc}%`}         color={"#5500bb"}/>
        <KPI title="Avg ROI Variance"        value={avgVar.toFixed(2)}     color={"#5500bb"} badge={{label:avgVar<0.1?"Low":avgVar<0.2?"Moderate":"High",color:avgVar<0.1?C.green:avgVar<0.2?C.yellow:C.red,bg:avgVar<0.1?"#e0f7f2":avgVar<0.2?"#fef9e7":"#fff1f0"}}/>
        <KPI title="Volume Accuracy"         value={`${volAcc}%`}          color={C.green}/>
        <KPI title="Promos Above Breakeven"  value={`${data.length?Math.round(aboveBE/data.length*100):0}%`} sub={`${aboveBE} of ${data.length}`} color="#5500bb"/>
      </div>
      <Card style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <SecTitle>Pre vs Post Comparison</SecTitle><DlBtn data={data} filename="pre_vs_post.csv"/>
        </div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
  <thead>
    {/* Row 1 — base info (rowspan 2) + group headers */}
    <tr>
      <BH l="Promo Name"/>
      <BH l="Customer"/>
      <BH l="Start"/>
      <BH l="End"/>
      <BH l="Brand"/>
      <BH l="Mechanism"/>
      <BH l="SKU"/>
      <GH l="Promo Cost" color="#5500bb"/>
      <GH l="Revenue"    color="#00967a"/>
      <GH l="Volume"     color="#0077cc"/>
      <GH l="ROI"        color="#cc5500"/>
    </tr>
    {/* Row 2 — sub-headers */}
    <tr>
      <SH l="Pre"/><SH l="Post"/><SH l="Var"/>
      <SH l="Pre"/><SH l="Post"/><SH l="Var"/>
      <SH l="Pre"/><SH l="Post"/><SH l="Var"/>
      <SH l="Pre"/><SH l="Post"/><SH l="Var" last/>
    </tr>
  </thead><tbody>{data.map((r,i)=>(<TR key={i} i={i}><TD>{r.promoName}</TD><TD>{r.customer}</TD><TD>{r.start}</TD><TD>{r.end}</TD><TD>{r.brand}</TD><TD>{r.mechanism}</TD><TD>{r.sku}</TD><TD>€{r.preCost.toLocaleString()}</TD><TD>€{r.postCost.toLocaleString()}</TD><VC val={r.costVar}/><TD>€{r.preRev.toLocaleString()}</TD><TD>€{r.postRev.toLocaleString()}</TD><VC val={r.revVar}/><TD>{r.preVol.toLocaleString()}</TD><TD>{r.postVol.toLocaleString()}</TD><VC val={r.volVar}/><td style={{padding:"7px 9px"}}><span style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontFamily:"'MarsBold',system-ui",color:roiColor(r.preRoi),background:roiBg(r.preRoi)}}>{r.preRoi.toFixed(2)}</span></td><td style={{padding:"7px 9px"}}><span style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontFamily:"'MarsBold',system-ui",color:roiColor(r.postRoi),background:roiBg(r.postRoi)}}>{r.postRoi.toFixed(2)}</span></td><VC val={r.roiVar}/></TR>))}</tbody></table></div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// Layout:
//   LEFT  — FilterSidebar (full height, only shown for Post-Promo & Pre/Post)
//   RIGHT — column: [title row] [tabs centered row] [content]
// ═══════════════════════════════════════════════════════════════════════════════

// ─── VIEWS SUB-NAV (left panel for Promo Simulator) ──────────────────────────
function ViewsNav({subTab,setSubTab}){
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"12px 10px",gap:4}}>
      <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",color:MARS.blue,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8,borderBottom:`1px solid ${C.border}`,paddingBottom:8}}>Views</div>
      {["Simulator","Baseline Data"].map(t=>{
        const on=t===subTab;
        return(
          <button key={t} onClick={()=>setSubTab(t)}
            style={{padding:"9px 12px",borderRadius:7,border:`1px solid ${on?MARS.blue:"transparent"}`,background:on?`${MARS.blue}10`:"transparent",cursor:"pointer",fontSize:11,fontFamily:on?"'MarsBold',system-ui":"inherit",color:on?MARS.blue:C.subtext,textAlign:"left",transition:"all .15s",display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:on?MARS.blue:"#dde0ef",flexShrink:0}}/>
            {t}
          </button>
        );
      })}
    </div>
  );
}

export default function PromotionsPage(){
  const [tab,setTab]=useState("Promo Simulator");
  const TABS=["Promo Simulator","Post-Promo","Pre vs Post Promo Analysis"];

  // Separate filter state for each tab
  const [postFilters,setPostFilters]=useState(FEMPTY);
  const [postApplied,setPostApplied]=useState(FEMPTY);
  const [preFilters, setPreFilters] =useState(FEMPTY);
  const [preApplied, setPreApplied] =useState(FEMPTY);
  const [simSubTab,  setSimSubTab]  =useState("Simulator");

  const showFilter = tab !== "Promo Simulator";
  const filters    = tab === "Post-Promo" ? postFilters : preFilters;
  const setFilters = tab === "Post-Promo" ? setPostFilters : setPreFilters;
  const onApply    = tab === "Post-Promo" ? ()=>setPostApplied({...postFilters}) : ()=>setPreApplied({...preFilters});
  const onReset    = tab === "Post-Promo"
    ? ()=>{setPostFilters(FEMPTY);setPostApplied(FEMPTY);}
    : ()=>{setPreFilters(FEMPTY);setPreApplied(FEMPTY);};

  return(
    <div style={{flex:1,display:"flex",overflow:"hidden",minWidth:0,minHeight:0,background:C.bg}}>

      {/* LEFT: Views sub-nav for Simulator, Filter panel for Post/Pre tabs */}
      <div style={{width:180,flexShrink:0,background:"#fff",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100%",minHeight:0,overflow:"hidden"}}>
        {showFilter
          ? <FilterSidebar filters={filters} setFilters={setFilters} onApply={onApply} onReset={onReset}/>
          : <ViewsNav subTab={simSubTab} setSubTab={setSimSubTab}/>
        }
      </div>

      {/* RIGHT: title + centered tabs + content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>

        {/* Row 1 — page title */}
        <div style={{padding:"12px 20px 10px",flexShrink:0,display:"flex",alignItems:"center",gap:8,background:C.card,borderBottom:`1px solid ${C.border}`}}>
          <div style={{width:4,height:20,background:MARS.yellow,borderRadius:2}}/>
          <span style={{fontFamily:"'MarsExtrabold',system-ui",fontSize:14,color:MARS.blue}}>Promotions</span>
        </div>

        {/* Row 2 — tabs centered */}
        <div style={{flexShrink:0,display:"flex",justifyContent:"center",alignItems:"center",padding:"12px 20px",background:C.card,borderBottom:`1px solid ${C.border}`}}>
          <TabBar tabs={TABS} active={tab} onChange={setTab}/>
        </div>

        {/* Row 3 — content */}
        <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
          {tab==="Promo Simulator"            && <PromoSimulatorTab subTab={simSubTab}/>}
          {tab==="Post-Promo"                 && <PostPromoContent  applied={postApplied}/>}
          {tab==="Pre vs Post Promo Analysis" && <PrePostContent    applied={preApplied}/>}
        </div>
      </div>
    </div>
  );
}