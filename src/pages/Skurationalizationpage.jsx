import { useState, useRef, useEffect } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useFilters } from "../context/FilterContext";
import { MARS } from "../data/mockData";

const PURPLE = "#5500bb";

// ── Seeded random ─────────────────────────────────────────────────────────────
const hash = s => { let h=5381; for(let i=0;i<s.length;i++) h=(h*33)^s.charCodeAt(i); return Math.abs(h); };
const sr   = seed => { const x=Math.sin(seed+1)*10000; return x-Math.floor(x); };
const vary = (base,seed,range=0.15) => parseFloat((base*(1+(sr(seed)-0.5)*range)).toFixed(3));

function useWidth(ref) {
  const [w,setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r&&r.width>0) setW(Math.floor(r.width));
    });
    const r = ref.current.getBoundingClientRect();
    if (r.width>0) setW(Math.floor(r.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

// ── SHARED ATOMS ──────────────────────────────────────────────────────────────
const Card = ({children,style}) => (
  <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e8f4",boxShadow:"0 2px 10px rgba(0,0,160,.05)",...style}}>
    {children}
  </div>
);
const SecTitle = ({children,sub}) => (
  <div style={{marginBottom:12}}>
    <div style={{fontSize:13,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>{children}</div>
    {sub && <div style={{fontSize:10,color:"#8b8fb8",marginTop:2}}>{sub}</div>}
  </div>
);
const InsightBox = ({type="info",title,children}) => {
  const s={info:{bg:"#f0f7ff",border:"#1a5fb4",title:"#1a5fb4",text:"#1a3c5e"},warn:{bg:"#fffbf0",border:"#d4a017",title:"#a07000",text:"#5a3e00"},alert:{bg:"#fff5f5",border:MARS.red,title:MARS.red,text:"#5a0010"}}[type]||{};
  return(
    <div style={{background:s.bg,borderLeft:`3px solid ${s.border}`,borderRadius:"0 8px 8px 0",padding:"10px 14px",marginBottom:14,fontSize:12,color:s.text}}>
      <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,color:s.title}}>{title}</div>
      {children}
    </div>
  );
};

function KPICard({label,value,changeLabel,sub,changeUp=true}) {
  return (
    <Card style={{padding:"14px 16px",flex:"1 1 0",minWidth:0,borderTop:`3px solid ${PURPLE}`}}>
      <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontFamily:"'MarsExtrabold',system-ui",color:"#1a1a2e",lineHeight:1,marginBottom:6}}>{value}</div>
      {changeLabel&&(
        <div style={{fontSize:10,fontFamily:"'MarsBold',system-ui",color:changeUp?"#00967a":MARS.red,background:changeUp?"#e0f7f2":"#fff1f0",borderRadius:20,padding:"1px 8px",display:"inline-block",marginBottom:4}}>
          {changeLabel}
        </div>
      )}
      {sub&&<div style={{fontSize:10,color:"#8b8fb8",marginTop:2}}>{sub}</div>}
    </Card>
  );
}

// ── SKU VELOCITY SCATTER ──────────────────────────────────────────────────────
function SkuScatter({ filters, velThresh, marginThresh, acvThresh, w, h }) {
  const s = hash(`sku-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Category}-${filters.Retailer}`);
  
  const healthy = [], watch = [], discontinue = [];
  for (let i = 0; i < 80; i++) {
    const vel = parseFloat((sr(s+i)*10).toFixed(1));
    const mgn = parseFloat((sr(s+i+100)*200).toFixed(0));
    const pt  = { x:vel, y:mgn };
    if (vel < velThresh && mgn < marginThresh) discontinue.push(pt);
    else if (vel < velThresh+2 || mgn < marginThresh+20) watch.push(pt);
    else healthy.push(pt);
  }

  const CustomTooltip = ({active,payload}) => {
    if (!active||!payload?.length) return null;
    const d = payload[0].payload;
    const status = d.x<velThresh&&d.mgn<marginThresh ? "Discontinue" : d.x<velThresh+2||d.y<marginThresh+20 ? "Watch List" : "Healthy";
    return(
      <div style={{background:"#fff",border:`1.5px solid ${MARS.blue}30`,borderRadius:10,padding:"10px 14px",boxShadow:"0 4px 20px rgba(0,0,160,.1)",fontSize:12}}>
        <div style={{fontFamily:"'MarsBold',system-ui",color:"#1a1a2e",marginBottom:4}}>{status}</div>
        <div style={{color:"#8b8fb8"}}>Velocity Score: <strong style={{color:"#1a1a2e"}}>{d.x}</strong></div>
        <div style={{color:"#8b8fb8"}}>Gross Margin: <strong style={{color:"#1a1a2e"}}>${d.y}K</strong></div>
      </div>
    );
  };

  return (
    <ScatterChart width={w} height={h} margin={{top:14,right:24,left:10,bottom:28}}>
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4"/>
      <XAxis type="number" dataKey="x" name="Velocity Score" domain={[0,10]}
        tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={{stroke:"#e0e0f0"}} tickLine={false}
        label={{value:"Velocity Score (1–10)",position:"insideBottom",offset:-14,fontSize:10,fill:"#8b8fb8"}}/>
      <YAxis type="number" dataKey="y" name="Gross Margin $K"
        tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={false} tickLine={false}
        label={{value:"Gross Margin $K",angle:-90,position:"insideLeft",offset:12,fontSize:10,fill:"#8b8fb8"}}/>
      <Tooltip content={<CustomTooltip/>}/>
      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:10,fontFamily:"'MarsBold',system-ui",paddingTop:8}}/>
      <Scatter name="Healthy SKUs"   data={healthy}     fill="rgba(39,174,96,.5)"  />
      <Scatter name="Watch List"     data={watch}       fill="rgba(240,165,0,.55)" />
      <Scatter name="Discontinue"    data={discontinue} fill="rgba(200,16,46,.7)"  />
    </ScatterChart>
  );
}

// ── BASE SKU DATA ─────────────────────────────────────────────────────────────
const BASE_SKU_DATA = [
  { sku:"SNK-CONV-MINI-2PK",  brand:"Snickers",  channel:"Convenience", baseVel:2.1, acv:"18%", gm:"$12K", cc:"$48K", subs:"92%", baseScore:18 },
  { sku:"MMS-DRUG-SING-STD",  brand:"M&M's",     channel:"Drug",        baseVel:1.8, acv:"24%", gm:"$8K",  cc:"$52K", subs:"88%", baseScore:15 },
  { sku:"TWX-GROC-BAG-10",    brand:"Twix",       channel:"Grocery",     baseVel:2.4, acv:"31%", gm:"$22K", cc:"$38K", subs:"76%", baseScore:22 },
  { sku:"SKT-CONV-KING-ALT",  brand:"Skittles",   channel:"Convenience", baseVel:1.4, acv:"19%", gm:"$6K",  cc:"$61K", subs:"94%", baseScore:11 },
  { sku:"SBR-MASS-MINI-3PK",  brand:"Starburst",  channel:"Mass",        baseVel:2.8, acv:"27%", gm:"$18K", cc:"$34K", subs:"82%", baseScore:24 },
  { sku:"SNK-DRUG-SHARE-2PK", brand:"Snickers",   channel:"Drug",        baseVel:1.2, acv:"15%", gm:"$4K",  cc:"$74K", subs:"96%", baseScore:8  },
  { sku:"MMS-CONV-ALMD-MINI", brand:"M&M's",      channel:"Convenience", baseVel:2.2, acv:"22%", gm:"$14K", cc:"$44K", subs:"89%", baseScore:19 },
  { sku:"TWX-DRUG-BAR-VAR",   brand:"Twix",       channel:"Drug",        baseVel:1.6, acv:"17%", gm:"$9K",  cc:"$58K", subs:"91%", baseScore:13 },
];

// ── DECISION FRAMEWORK ────────────────────────────────────────────────────────
function DecisionFramework({ velThresh, setVelThresh, marginThresh, setMarginThresh, acvThresh, setAcvThresh, filters }) {
  const s = hash(`dec-${filters.Market}-${filters.Period}-${filters.Year}`);
  const cnt     = Math.round(12 + (10-velThresh)*2 + (50-marginThresh)*0.2);
  const revPct  = parseFloat((cnt * 0.065).toFixed(1));
  const saving  = parseFloat((cnt * 0.66).toFixed(1));

  const Slider = ({label,value,onChange,min,max,fmt}) => (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f0f0f8"}}>
      <div style={{width:140,fontSize:12,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>{label}</div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(parseFloat(e.target.value))}
        style={{flex:1,accentColor:MARS.red}}/>
      <div style={{width:50,textAlign:"right",fontSize:13,fontFamily:"'MarsExtrabold',system-ui",color:MARS.red}}>{fmt(value)}</div>
    </div>
  );

  return (
    <Card style={{padding:"16px 18px"}}>
      <SecTitle sub="Score threshold settings">Decision Framework</SecTitle>
      <Slider label="Min Velocity Score" value={velThresh}    onChange={setVelThresh}    min={1}  max={10} fmt={v=>`${v}.0`}/>
      <Slider label="Min Margin $"       value={marginThresh} onChange={setMarginThresh} min={0}  max={100} fmt={v=>`$${v}K`}/>
      <Slider label="Min ACV %"          value={acvThresh}    onChange={setAcvThresh}    min={10} max={80} fmt={v=>`${v}%`}/>

      {/* Result panel */}
      <div style={{background:`linear-gradient(135deg,${MARS.blue},#0000c8)`,borderRadius:12,padding:16,color:"#fff",textAlign:"center",marginTop:14}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".05em"}}>SKUs Meeting Discontinuation Criteria</div>
        <div style={{fontSize:28,fontFamily:"'MarsExtrabold',system-ui",color:"#fff",margin:"6px 0"}}>{cnt} SKUs</div>
        <div style={{display:"flex",justifyContent:"space-around",marginTop:12}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:16,fontFamily:"'MarsExtrabold',system-ui",color:"#ffd166"}}>{revPct}%</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>Revenue %</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:16,fontFamily:"'MarsExtrabold',system-ui",color:"#5dde91"}}>${saving}M</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>Cost Saving</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:16,fontFamily:"'MarsExtrabold',system-ui",color:"#5dde91"}}>84%</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>Substitutable</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── SKU WATCHLIST TABLE ───────────────────────────────────────────────────────
function SkuWatchlist({ filters, velThresh, marginThresh }) {
  const s = hash(`watch-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Category}`);
  const [decisions, setDecisions] = useState({});

  const data = BASE_SKU_DATA.map((r,i) => ({
    ...r,
    vel:   parseFloat(vary(r.baseVel,  s+i,    0.22).toFixed(1)),
    score: Math.round(vary(r.baseScore,s+i+10, 0.18)),
  })).sort((a,b) => a.score - b.score);

  const getRec   = score => score<=15 ? "Discontinue" : score<=22 ? "Review" : "Keep";
  const getClass = score => score<=15 ? {bg:MARS.red,color:"#fff"} : score<=22 ? {bg:"#d4a017",color:"#fff"} : {bg:"#27ae60",color:"#fff"};
  const velBadge = vel => {
    const t = vel<2?"red":vel<3?"gold":"green";
    const c = {red:{bg:"#fde8ec",color:MARS.red},gold:{bg:"#fff3d0",color:"#a07000"},green:{bg:"#d4f5e2",color:"#1a7a40"}}[t];
    return <span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontFamily:"'MarsBold',system-ui",background:c.bg,color:c.color}}>{vel}</span>;
  };

  const th = {padding:"8px 10px",textAlign:"left",fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".06em",background:"#f8f8fc",borderBottom:"2px solid #e8e8f4",whiteSpace:"nowrap"};
  const td = {padding:"8px 10px",fontSize:11,borderBottom:"1px solid #f0f0f8",whiteSpace:"nowrap"};

  return (
    <Card style={{padding:"16px 18px"}}>
      <SecTitle sub="Flagged SKUs requiring decision · Sorted by composite score">
        SKU Rationalization Watchlist
      </SecTitle>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              {["SKU","Brand","Channel","Velocity","ACV %","Gross Margin $","Complexity Cost","Substitutability","Score","Recommendation"].map(h=>(
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r,i) => {
              const rec = decisions[r.sku] || getRec(r.score);
              const cls = getClass(r.score);
              return (
                <tr key={i} style={{background:i%2===0?"#fff":"#f9f9fc"}}
                  onMouseOver={e=>e.currentTarget.style.background=`${MARS.blue}06`}
                  onMouseOut={e=>e.currentTarget.style.background=i%2===0?"#fff":"#f9f9fc"}>
                  <td style={{...td,fontFamily:"monospace",fontSize:10,color:"#6b6b80"}}>{r.sku}</td>
                  <td style={{...td,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>{r.brand}</td>
                  <td style={td}>{r.channel}</td>
                  <td style={td}>{velBadge(r.vel)}</td>
                  <td style={td}>{r.acv}</td>
                  <td style={td}>{r.gm}</td>
                  <td style={{...td,color:MARS.red}}>{r.cc}</td>
                  <td style={{...td,color:"#00967a"}}>{r.subs}</td>
                  <td style={td}>
                    <strong style={{fontSize:13,color:r.score<=15?MARS.red:r.score<=22?"#d4a017":"#00967a"}}>{r.score}</strong>
                    <span style={{color:"#8b8fb8",fontSize:10}}>/100</span>
                  </td>
                  <td style={td}>
                    <button
                      style={{padding:"4px 12px",borderRadius:6,border:"none",background:cls.bg,color:cls.color,fontSize:10,fontFamily:"'MarsBold',system-ui",cursor:"pointer"}}
                      onClick={() => {
                        const next = rec==="Discontinue"?"Keep":rec==="Review"?"Discontinue":"Review";
                        setDecisions(d=>({...d,[r.sku]:next}));
                        alert(`Decision recorded: ${rec} for ${r.sku}\nClick again to cycle through options.`);
                      }}>
                      {rec}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SkuRationalizationPage() {
  const { filters } = useFilters();

  // Decision framework state — drives both scatter and table
  const [velThresh,    setVelThresh]    = useState(3);
  const [marginThresh, setMarginThresh] = useState(25);
  const [acvThresh,    setAcvThresh]    = useState(30);

  const s = hash(`sku-kpi-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Category}-${filters.Retailer}`);
  const kpis = [
    { label:"Total Active SKUs",          value:String(Math.round(vary(312,s+1,0.12))),    changeLabel:"Mars Snacking Portfolio", sub:`Benchmark: 240–260 optimal`,       changeUp:false },
    { label:"SKUs for Discontinuation",   value:String(Math.round(vary(28,s+2,0.22))),     changeLabel:"Bottom velocity decile",  sub:`~9% of SKUs · <2% of revenue`,     changeUp:false },
    { label:"Complexity Cost Savings",    value:`$${vary(18.4,s+3,0.22).toFixed(1)}M`,     changeLabel:"If flagged SKUs removed", sub:`Changeovers, MOQ, waste`,          changeUp:true  },
    { label:"Consumer Substitutability",  value:`${Math.round(vary(84,s+4,0.08))}%`,       changeLabel:"▲ Of flagged SKU buyers", sub:`Will switch to another Mars SKU`,  changeUp:true  },
  ];

  const ref = useRef(null);
  const w   = useWidth(ref);

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"#f0f2f8",overflow:"hidden",minWidth:0,minHeight:0}}>

      {/* Page header */}
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:4,height:20,background:MARS.yellow,borderRadius:2}}/>
          <span style={{fontFamily:"'MarsExtrabold',system-ui",fontSize:15,color:MARS.blue}}>SKU Rationalization</span>
          <span style={{fontSize:11,color:"#8b8fb8"}}>· {filters.Market} · {filters.Period} {filters.Year}</span>
        </div>
        <InsightBox type="info" title="🎯 Key Decision">
          Which low-performing Mars snacking SKUs should be discontinued to reduce supply chain complexity and redeploy investment to growth SKUs?
        </InsightBox>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:14}}>

        {/* KPI row */}
        <div style={{display:"flex",gap:10}}>
          {kpis.map((k,i) => <KPICard key={i} {...k}/>)}
        </div>

        {/* Row 1: Scatter (left 2/3) + Decision Framework (right 1/3) */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
          <Card style={{padding:"16px 18px"}}>
            <SecTitle sub="Revenue contribution vs complexity cost · Each dot = 1 SKU">
              SKU Velocity Decile Analysis
            </SecTitle>
            <div ref={ref} style={{width:"100%",overflow:"hidden"}}>
              {w>10 && (
                <SkuScatter
                  filters={filters}
                  velThresh={velThresh}
                  marginThresh={marginThresh}
                  acvThresh={acvThresh}
                  w={w} h={280}
                />
              )}
            </div>
          </Card>
          <DecisionFramework
            velThresh={velThresh}       setVelThresh={setVelThresh}
            marginThresh={marginThresh} setMarginThresh={setMarginThresh}
            acvThresh={acvThresh}       setAcvThresh={setAcvThresh}
            filters={filters}
          />
        </div>

        {/* Row 2: Watchlist table */}
        <SkuWatchlist
          filters={filters}
          velThresh={velThresh}
          marginThresh={marginThresh}
        />

      </div>
    </div>
  );
}