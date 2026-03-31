import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useFilters } from "../context/FilterContext";
import { MARS } from "../data/mockData";

const PURPLE = "#5500bb";

// ── Seeded random ─────────────────────────────────────────────────────────────
const hash = s => { let h=5381; for(let i=0;i<s.length;i++) h=(h*33)^s.charCodeAt(i); return Math.abs(h); };
const sr   = seed => { const x=Math.sin(seed+1)*10000; return x-Math.floor(x); };
const vary = (base,seed,range=0.12) => parseFloat((base*(1+(sr(seed)-0.5)*range)).toFixed(3));

// ── useWidth ──────────────────────────────────────────────────────────────────
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

function ChartBox({ height=240, children }) {
  const ref = useRef(null);
  const w   = useWidth(ref);
  return <div ref={ref} style={{width:"100%",overflow:"hidden"}}>{w>10 && children(w,height)}</div>;
}

// ── SHARED ATOMS ──────────────────────────────────────────────────────────────
const Card = ({children,style}) => (
  <div style={{ background:"#fff",borderRadius:12,border:"1px solid #e8e8f4",boxShadow:"0 2px 10px rgba(0,0,160,.05)",...style }}>
    {children}
  </div>
);
const SecTitle = ({children,sub}) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontSize:13,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e" }}>{children}</div>
    {sub&&<div style={{ fontSize:10,color:"#8b8fb8",marginTop:2 }}>{sub}</div>}
  </div>
);
const InsightBox = ({type="warn",title,children}) => {
  const s = {
    info:  {bg:"#f0f7ff",border:"#1a5fb4",title:"#1a5fb4",text:"#1a3c5e"},
    warn:  {bg:"#fffbf0",border:"#d4a017",title:"#a07000",text:"#5a3e00"},
    alert: {bg:"#fff5f5",border:MARS.red,  title:MARS.red,  text:"#5a0010"},
  }[type]||{};
  return (
    <div style={{ background:s.bg,borderLeft:`3px solid ${s.border}`,borderRadius:"0 8px 8px 0",padding:"10px 14px",marginBottom:14,fontSize:12,color:s.text }}>
      <div style={{ fontSize:9,fontFamily:"'MarsBold',system-ui",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,color:s.title }}>{title}</div>
      {children}
    </div>
  );
};

const Badge = ({children,type="green"}) => {
  const c = {
    green: {bg:"#d4f5e2",color:"#1a7a40"},
    red:   {bg:"#fde8ec",color:MARS.red},
    gold:  {bg:"#fff3d0",color:"#a07000"},
    blue:  {bg:"#dde8ff",color:"#1a3c8e"},
    gray:  {bg:"#f0f0f0",color:"#555"},
  }[type]||{};
  return <span style={{ display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontFamily:"'MarsBold',system-ui",background:c.bg,color:c.color }}>{children}</span>;
};

// JBP Health symbol
const JBPHealth = ({score}) => {
  if (score >= 75) return (
    <div style={{ display:"flex",alignItems:"center",gap:5 }}>
      <span style={{ width:18,height:18,borderRadius:"50%",background:"#d4f5e2",border:"1.5px solid #1a7a40",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <svg style={{ width:10,height:10,color:"#1a7a40" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <span style={{ fontSize:10,fontFamily:"'MarsBold',system-ui",color:"#1a7a40" }}>Low Risk</span>
    </div>
  );
  if (score >= 55) return (
    <div style={{ display:"flex",alignItems:"center",gap:5 }}>
      <span style={{ width:18,height:18,borderRadius:4,background:"#fff3d0",border:"1.5px solid #d4a017",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <svg style={{ width:10,height:10,color:"#d4a017" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <span style={{ fontSize:10,fontFamily:"'MarsBold',system-ui",color:"#a07000" }}>Medium Risk</span>
    </div>
  );
  return (
    <div style={{ display:"flex",alignItems:"center",gap:5 }}>
      <span style={{ width:18,height:18,borderRadius:"50%",background:"#fde8ec",border:"1.5px solid #c8102e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <span style={{ width:7,height:7,borderRadius:"50%",background:MARS.red,display:"inline-block",animation:"blink 1.2s ease-in-out infinite" }}/>
      </span>
      <span style={{ fontSize:10,fontFamily:"'MarsBold',system-ui",color:MARS.red }}>High Risk</span>
    </div>
  );
};

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KPICard({label,value,change,changeLabel,sub,changeUp}) {
  const up = changeUp !== undefined ? changeUp : (typeof change==="number" ? change>=0 : String(change).startsWith("+") || String(change).startsWith("▲"));
  return (
    <Card style={{ padding:"14px 16px",flex:"1 1 0",minWidth:0,borderTop:`3px solid ${PURPLE}` }}>
      <div style={{ fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22,fontFamily:"'MarsExtrabold',system-ui",color:"#1a1a2e",lineHeight:1,marginBottom:6 }}>{value}</div>
      {changeLabel && (
        <div style={{ fontSize:10,fontFamily:"'MarsBold',system-ui",color:up?"#00967a":MARS.red,background:up?"#e0f7f2":"#fff1f0",borderRadius:20,padding:"1px 8px",display:"inline-block",marginBottom:4 }}>
          {changeLabel}
        </div>
      )}
      {sub && <div style={{ fontSize:10,color:"#8b8fb8",marginTop:2 }}>{sub}</div>}
    </Card>
  );
}

// ── 1. ROI VS SPEND QUADRANT ──────────────────────────────────────────────────
const RETAILERS = [
  {name:"Retailer X (Walmart)", spend:148, roi:1.38, vol:280, us:true},
  {name:"Retailer Y (Kroger)",  spend:89,  roi:1.21, vol:180, us:false},
  {name:"Retailer Z (Target)",  spend:74,  roi:1.14, vol:148, us:false},
  {name:"Club Channel",         spend:62,  roi:1.52, vol:124, us:false},
  {name:"Drug Channel",         spend:44,  roi:0.94, vol:88,  us:false},
];

function ROIQuadrantChart({filters,w,h}) {
  const s = hash(`roi-${filters.Market}-${filters.Period}-${filters.Year}`);
  const data = RETAILERS.map((r,i) => ({
    ...r,
    spend: parseFloat(vary(r.spend,s+i,0.18).toFixed(1)),
    roi:   parseFloat(vary(r.roi,s+i+10,0.12).toFixed(2)),
    vol:   Math.round(vary(r.vol,s+i+20,0.15)),
  }));

  // Fixed axis ranges for clean quadrant split
  const spendMin=20, spendMax=180, roiMin=0.7, roiMax=1.8;
  const splitSpend = 90, splitRoi = 1.2; // quadrant dividers

  // Margins for axes
  const ml=52, mr=20, mt=20, mb=40;
  const cw = w - ml - mr;
  const ch = h - mt - mb;

  // Map data coords → pixel
  const px = spend => ml + ((spend-spendMin)/(spendMax-spendMin))*cw;
  const py = roi   => mt + ch - ((roi-roiMin)/(roiMax-roiMin))*ch;

  // Quadrant divider pixel positions
  const qx = px(splitSpend);
  const qy = py(splitRoi);

  // Bubble color by quadrant
  const bubbleColor = d => {
    if (d.roi>=splitRoi && d.spend>=splitSpend) return "#1a5fb4"; // OPTIMISE — top right blue
    if (d.roi>=splitRoi && d.spend< splitSpend) return "#27ae60"; // GROW — top left green
    if (d.roi< splitRoi && d.spend>=splitSpend) return "#c8102e"; // EXIT — bottom right red
    return "#e67e22";                                               // REASSESS — bottom left orange
  };

  // Y axis ticks
  const yTicks = [0.8,1.0,1.2,1.4,1.6];
  const xTicks = [40,80,120,160];

  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{position:"relative", userSelect:"none"}}>
      <svg width={w} height={h}>
        {/* ── Quadrant backgrounds ── */}
        {/* GROW: top-left — green */}
        <rect x={ml} y={mt} width={qx-ml} height={qy-mt} fill="#27ae60" fillOpacity={0.15}/>
        {/* OPTIMISE: top-right — blue */}
        <rect x={qx} y={mt} width={ml+cw-qx} height={qy-mt} fill="#1a5fb4" fillOpacity={0.15}/>
        {/* REASSESS: bottom-left — orange */}
        <rect x={ml} y={qy} width={qx-ml} height={mt+ch-qy} fill="#e67e22" fillOpacity={0.15}/>
        {/* EXIT: bottom-right — red */}
        <rect x={qx} y={qy} width={ml+cw-qx} height={mt+ch-qy} fill="#c8102e" fillOpacity={0.15}/>

        {/* ── Quadrant border lines ── */}
        <line x1={qx} y1={mt} x2={qx} y2={mt+ch} stroke="rgba(0,0,0,.15)" strokeWidth={1.5} strokeDasharray="6 3"/>
        <line x1={ml} y1={qy} x2={ml+cw} y2={qy} stroke="rgba(0,0,0,.15)" strokeWidth={1.5} strokeDasharray="6 3"/>

        {/* ── Quadrant labels ── */}
        <text x={ml+10}      y={mt+22} fontSize={13} fontWeight="900" fill="#27ae60" opacity={0.85} fontFamily="system-ui">GROW</text>
        <text x={qx+10}      y={mt+22} fontSize={13} fontWeight="900" fill="#1a5fb4" opacity={0.85} fontFamily="system-ui">OPTIMISE</text>
        <text x={ml+10}      y={mt+ch-10} fontSize={13} fontWeight="900" fill="#e67e22" opacity={0.85} fontFamily="system-ui">REASSESS</text>
        <text x={qx+10}      y={mt+ch-10} fontSize={13} fontWeight="900" fill="#c8102e" opacity={0.85} fontFamily="system-ui">EXIT</text>

        {/* ── Y axis ── */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={ml-4} y1={py(v)} x2={ml} y2={py(v)} stroke="#ccc" strokeWidth={1}/>
            <text x={ml-8} y={py(v)+4} textAnchor="end" fontSize={9} fill="#8b8fb8">{v.toFixed(1)}x</text>
          </g>
        ))}
        <text x={14} y={mt+ch/2} textAnchor="middle" fontSize={10} fill="#8b8fb8"
          transform={`rotate(-90,14,${mt+ch/2})`}>Trade ROI</text>

        {/* ── X axis ── */}
        {xTicks.map(v => (
          <g key={v}>
            <line x1={px(v)} y1={mt+ch} x2={px(v)} y2={mt+ch+4} stroke="#ccc" strokeWidth={1}/>
            <text x={px(v)} y={mt+ch+14} textAnchor="middle" fontSize={9} fill="#8b8fb8">${v}M</text>
          </g>
        ))}
        <text x={ml+cw/2} y={h-4} textAnchor="middle" fontSize={10} fill="#8b8fb8">Trade Spend $M</text>

        {/* ── Axis labels: Low/High ── */}
        <text x={ml}    y={h-4} textAnchor="start"  fontSize={9} fill="#aaa">Low</text>
        <text x={ml+cw} y={h-4} textAnchor="end"    fontSize={9} fill="#aaa">High</text>
        <text x={ml-8}  y={mt+ch} textAnchor="end"  fontSize={9} fill="#aaa">Low</text>
        <text x={ml-8}  y={mt+4}  textAnchor="end"  fontSize={9} fill="#aaa">High</text>

        {/* ── Bubbles ── */}
        {data.map((d,i) => {
          const cx   = px(d.spend);
          const cy   = py(d.roi);
          const r    = 8 + Math.sqrt(d.vol/220)*7;
          const fill = bubbleColor(d);
          const label = d.name.split(" ")[0].replace("(","").replace(")","");
          return (
            <g key={i} style={{cursor:"pointer"}}
              onMouseEnter={e => setTooltip({d, x:cx, y:cy})}
              onMouseLeave={() => setTooltip(null)}>
              {/* Glow ring */}
              <circle cx={cx} cy={cy} r={r+3} fill={fill} fillOpacity={0.2}/>
              {/* Main bubble */}
              <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} stroke="#fff" strokeWidth={2}/>
              {/* Label inside bubble */}
              <text x={cx} y={cy+4} textAnchor="middle" fontSize={8}
                fontFamily="'MarsBold',system-ui" fill="#fff" fontWeight="700">
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:"absolute",
          left: tooltip.x + 16,
          top:  Math.max(0, tooltip.y - 40),
          background:"#fff",
          border:`1.5px solid ${MARS.blue}30`,
          borderRadius:10,
          padding:"10px 14px",
          boxShadow:"0 4px 20px rgba(0,0,160,.14)",
          fontSize:12,
          pointerEvents:"none",
          zIndex:10,
          minWidth:180,
        }}>
          <div style={{fontFamily:"'MarsBold',system-ui",color:"#1a1a2e",marginBottom:4}}>{tooltip.d.name}</div>
          <div style={{color:"#8b8fb8"}}>Spend: <strong style={{color:"#1a1a2e"}}>${tooltip.d.spend}M</strong></div>
          <div style={{color:"#8b8fb8"}}>ROI: <strong style={{color:"#1a1a2e"}}>{tooltip.d.roi}x</strong></div>
          <div style={{color:"#8b8fb8"}}>Vol Lift: <strong style={{color:"#1a1a2e"}}>{tooltip.d.vol}K</strong></div>
          <div style={{marginTop:6,fontSize:10,fontFamily:"'MarsBold',system-ui",
            color: tooltip.d.roi>=splitRoi&&tooltip.d.spend>=splitSpend?"#1a5fb4":
                   tooltip.d.roi>=splitRoi?"#27ae60":
                   tooltip.d.spend>=splitSpend?"#c8102e":"#e67e22"}}>
            {tooltip.d.roi>=splitRoi&&tooltip.d.spend>=splitSpend?"OPTIMISE":
             tooltip.d.roi>=splitRoi?"GROW":
             tooltip.d.spend>=splitSpend?"EXIT":"REASSESS"}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2. TOP 10 UNDERPERFORMING PROMOTIONS — compact scrollable list ─────────────
function UnderperformingPromos({filters}) {
  const s = hash(`underperf-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Retailer}`);
  const base = [
    {promo:"Buy 2 Get 1 Free",     retailer:"CVS",           roi:0.65, margin:-500},
    {promo:"Endcap Display",       retailer:"Kroger",        roi:0.72, margin:-450},
    {promo:"BOGO Deal",            retailer:"Target",        roi:0.80, margin:-330},
    {promo:"Price Reduction",      retailer:"Walmart",       roi:0.85, margin:-300},
    {promo:"Bulk Discount",        retailer:"Costco",        roi:0.90, margin:-250},
    {promo:"Bonus Pack 25% Extra", retailer:"Club Channel",  roi:0.91, margin:-190},
    {promo:"Flash 30% Off",        retailer:"Drug Channel",  roi:0.92, margin:-160},
    {promo:"Mix & Save 4 for 3",   retailer:"Retailer Z",   roi:0.93, margin:-145},
    {promo:"Weekend TPR -18%",     retailer:"Convenience",   roi:0.94, margin:-130},
    {promo:"Shelf Deal -15%",      retailer:"Retailer Y",   roi:0.95, margin:-110},
  ];
  const data = base.map((r,i) => ({
    ...r,
    roi:    parseFloat(vary(r.roi,   s+i,    0.05).toFixed(2)),
    margin: Math.round(vary(r.margin,s+i+10, 0.08)),
  }));

  const roiColor = roi => roi < 0.75 ? MARS.red : roi < 0.85 ? "#d4a017" : "#555577";

  return (
    <Card style={{padding:"14px 16px", display:"flex", flexDirection:"column", height:"100%"}}>
      <div style={{marginBottom:10, flexShrink:0}}>
        <div style={{fontSize:11, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e", textTransform:"uppercase", letterSpacing:".06em"}}>
          Top 10 Underperforming Promotions
        </div>
        <div style={{fontSize:9, color:"#8b8fb8", marginTop:2}}>Below-breakeven ROI · Scrollable</div>
      </div>
      <div style={{overflowY:"auto", flex:1}}>
        {data.map((r,i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"7px 0",
            borderBottom: i < data.length-1 ? "1px solid #f4f4f8" : "none",
            flexWrap:"nowrap",
          }}>
            <span style={{fontSize:11, fontFamily:"'MarsBold',system-ui", color:"#c0c0d0", width:16, flexShrink:0}}>{i+1}.</span>
            <span style={{fontSize:11, color:"#1a1a2e", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", minWidth:0}}>
              <span style={{fontFamily:"'MarsBold',system-ui"}}>"{r.promo}"</span> at {r.retailer}
            </span>
            <span style={{fontSize:10, fontFamily:"'MarsBold',system-ui", color:roiColor(r.roi), whiteSpace:"nowrap", flexShrink:0}}>
              ROI: {r.roi.toFixed(2)},
            </span>
            <span style={{fontSize:10, fontFamily:"'MarsBold',system-ui", color:MARS.red, whiteSpace:"nowrap", flexShrink:0}}>
              Margin: -${Math.abs(r.margin).toLocaleString()}K
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 3. RETAILER P&L WATERFALL ─────────────────────────────────────────────────
function WaterfallChart({filters,w,h}) {
  const s = hash(`waterfall-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Retailer}`);
  const data = [
    {name:"Gross\nRevenue",    value:Math.round(vary(2340,s,   0.18)), color:"#d4f5e2",stroke:"#1a7a40"},
    {name:"Off-Invoice",       value:Math.round(vary(-148,s+1, 0.20)), color:"#fde8ec",stroke:MARS.red},
    {name:"On-Invoice",        value:Math.round(vary(-89, s+2, 0.20)), color:"#fde8ec",stroke:MARS.red},
    {name:"Scan",              value:Math.round(vary(-112,s+3, 0.20)), color:"#fde8ec",stroke:MARS.red},
    {name:"Co-op / MDF",       value:Math.round(vary(-74, s+4, 0.20)), color:"#fde8ec",stroke:MARS.red},
    {name:"Other",             value:Math.round(vary(-34, s+5, 0.25)), color:"#fde8ec",stroke:MARS.red},
    {name:"Net Revenue",       value:Math.round(vary(1883,s+6, 0.18)), color:"#dde8ff",stroke:"#1a3c8e"},
  ];
  return (
    <BarChart width={w} height={h} data={data} margin={{top:14,right:20,left:10,bottom:5}}>
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4"/>
      <XAxis dataKey="name" tick={{fontSize:9,fill:"#8b8fb8"}} axisLine={{stroke:"#e0e0f0"}} tickLine={false}/>
      <YAxis tickFormatter={v=>`$${v}M`} tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={false} tickLine={false}/>
      <Tooltip formatter={(v)=>[`$${v}M`]} contentStyle={{fontSize:12,borderRadius:8}}/>
      <Bar dataKey="value" radius={[5,5,0,0]}
        label={{position:"top",fontSize:9,fontFamily:"'MarsBold',system-ui",fill:"#3a3a5c",formatter:v=>`$${v}M`}}>
        {data.map((d,i)=><Cell key={i} fill={d.color} stroke={d.stroke} strokeWidth={1}/>)}
      </Bar>
    </BarChart>
  );
}

// ── 4. JBP SCORECARD ─────────────────────────────────────────────────────────
function JBPScorecard({filters}) {
  const s = hash(`jbp-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Retailer}`);
  const base = [
    {retailer:"Retailer X",  spend:148,pctNr:18.4,volLift:22,roi:1.38,shelf:94,acv:97.2,score:82},
    {retailer:"Retailer Y",  spend:89, pctNr:21.2,volLift:18,roi:1.21,shelf:87,acv:94.8,score:71},
    {retailer:"Retailer Z",  spend:74, pctNr:22.8,volLift:14,roi:1.14,shelf:82,acv:91.3,score:66},
    {retailer:"Club Channel",spend:62, pctNr:16.1,volLift:31,roi:1.52,shelf:96,acv:99.1,score:91},
    {retailer:"Drug Channel",spend:44, pctNr:28.6,volLift:9, roi:0.94,shelf:74,acv:82.4,score:48},
  ];
  const data = base.map((r,i)=>({
    ...r,
    spend:   parseFloat(vary(r.spend,  s+i,    0.15).toFixed(0)),
    pctNr:   parseFloat(vary(r.pctNr,  s+i+10, 0.12).toFixed(1)),
    volLift: Math.round(vary(r.volLift,s+i+20, 0.18)),
    roi:     parseFloat(vary(r.roi,    s+i+30, 0.12).toFixed(2)),
    shelf:   Math.round(vary(r.shelf,  s+i+40, 0.08)),
    acv:     parseFloat(vary(r.acv,    s+i+50, 0.06).toFixed(1)),
    score:   Math.round(vary(r.score,  s+i+60, 0.12)),
  }));

  const roiC = v => v>=1.3?"#1a7a40":v>=1.1?"#a07000":MARS.red;
  const roiB = v => v>=1.3?"#d4f5e2":v>=1.1?"#fff3d0":"#fde8ec";
  const badgeT = v => v>=90?"green":v>=80?"blue":v>=70?"gold":"red";
  const th = {padding:"8px 10px",textAlign:"left",fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".06em",background:"#f8f8fc",borderBottom:"2px solid #e8e8f4",whiteSpace:"nowrap"};
  const td = {padding:"8px 10px",fontSize:11,borderBottom:"1px solid #f0f0f8",whiteSpace:"nowrap"};

  return (
    <Card style={{padding:"16px 18px"}}>
      <SecTitle sub="Joint Business Plan KPI tracking · Current period">JBP Scorecard — Top Retailers</SecTitle>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              {["Retailer","Trade Spend $M","Spend % NR","Vol Lift","Scan ROI","Shelf Compliance","Distribution ACV","JBP Score","JBP Health"].map(h=>(
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r,i)=>(
              <tr key={i} style={{background:i%2===0?"#fff":"#f9f9fc"}}
                onMouseOver={e=>e.currentTarget.style.background=`${MARS.blue}06`}
                onMouseOut={e=>e.currentTarget.style.background=i%2===0?"#fff":"#f9f9fc"}>
                <td style={{...td,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>{r.retailer}</td>
                <td style={td}>${r.spend}M</td>
                <td style={td}>{r.pctNr}%</td>
                <td style={{...td,fontFamily:"'MarsBold',system-ui",color:"#00967a"}}>+{r.volLift}%</td>
                <td style={td}>
                  <span style={{fontFamily:"'MarsBold',system-ui",color:roiC(r.roi),background:roiB(r.roi),borderRadius:20,padding:"2px 8px",fontSize:10}}>{r.roi.toFixed(2)}x</span>
                </td>
                <td style={td}><Badge type={badgeT(r.shelf)}>{r.shelf}%</Badge></td>
                <td style={td}><Badge type={badgeT(r.acv)}>{r.acv}%</Badge></td>
                <td style={{...td}}>
                  <span style={{fontFamily:"'MarsExtrabold',system-ui",color:r.score>=75?"#1a7a40":r.score>=55?"#a07000":MARS.red,fontSize:13}}>{r.score}</span>
                  <span style={{color:"#8b8fb8",fontSize:10}}>/100</span>
                </td>
                <td style={{...td}}><JBPHealth score={r.score}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.some(r=>r.score<55) && (
        <div style={{marginTop:12,padding:"10px 14px",background:"#fff5f5",borderLeft:`3px solid ${MARS.red}`,borderRadius:"0 8px 8px 0",fontSize:11,color:"#5a0010"}}>
          <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,color:MARS.red}}>⚠ Action Required</div>
          {data.filter(r=>r.score<55).map(r=>r.retailer).join(", ")} — Trade ROI below breakeven with high spend-to-NR ratio. Recommend restructuring trade terms: shift from off-invoice to scan-based payment.
        </div>
      )}
    </Card>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function TradeTermsPage() {
  const { filters } = useFilters();
  const s = hash(`trade-kpi-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Retailer}`);

  const kpis = [
    {
      label:       "Total Trade Spend",
      value:       `$${vary(487,s+1,0.20).toFixed(0)}M`,
      changeLabel: `▲ +${vary(6.2,s+10,0.30).toFixed(1)}% vs YA`,
      sub:         `% Net Revenue: ${vary(20.8,s+11,0.12).toFixed(1)}%`,
      changeUp:    false,
    },
    {
      label:       "Trade ROI",
      value:       `${vary(1.24,s+2,0.14).toFixed(2)}x`,
      changeLabel: `▲ +${vary(0.08,s+12,0.30).toFixed(2)}x vs YA`,
      sub:         "Target: 1.20x · ✓ Achieved",
      changeUp:    true,
    },
    {
      label:       "Leakage Identified",
      value:       `$${vary(4.8,s+3,0.25).toFixed(1)}M`,
      changeLabel: "Duplicate / invalid claims",
      sub:         `${vary(1.0,s+13,0.20).toFixed(1)}% of spend · Recoverable`,
      changeUp:    false,
    },
    {
      label:       "Incremental Margin",
      value:       `$${vary(38.4,s+4,0.22).toFixed(1)}M`,
      changeLabel: `▲ +${vary(3.2,s+14,0.30).toFixed(1)}% vs YA`,
      sub:         `Net of trade investment · Target: $${vary(40,s+15,0.10).toFixed(0)}M`,
      changeUp:    true,
    },
  ];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"#f0f2f8",overflow:"hidden",minWidth:0,minHeight:0}}>

      {/* Page header */}
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:4,height:20,background:MARS.yellow,borderRadius:2}}/>
          <span style={{fontFamily:"'MarsExtrabold',system-ui",fontSize:15,color:MARS.blue}}>Trade &amp; Terms</span>
          <span style={{fontSize:11,color:"#8b8fb8"}}>· {filters.Market} · {filters.Period} {filters.Year}</span>
        </div>
        <InsightBox type="info" title="🎯 Key Decision">
          Is Mars trade investment with key retailers generating measurable sell-through lift and positive margin ROI, and where is spend leaking?
        </InsightBox>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:14}}>

        {/* KPI row */}
        <div style={{display:"flex",gap:10}}>
          {kpis.map((k,i)=><KPICard key={i} {...k}/>)}
        </div>

        {/* Row 1: ROI Quadrant (left, large) + Underperforming list (right, compact scrollable) */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"stretch"}}>
          <Card style={{padding:"16px 18px"}}>
            <SecTitle sub="Bubble size = Volume Lift · Quadrants show investment efficiency">
              ROI vs Spend Matrix
            </SecTitle>
            <ChartBox height={340}>
              {(w,h) => <ROIQuadrantChart filters={filters} w={w} h={h}/>}
            </ChartBox>
          </Card>
          <UnderperformingPromos filters={filters}/>
        </div>

        {/* Row 2: Retailer P&L Waterfall */}
        <Card style={{padding:"16px 18px"}}>
          <SecTitle sub="Net Revenue to Trade-invested Margin by deduction type · $M">
            Retailer P&amp;L Waterfall
          </SecTitle>
          <ChartBox height={200}>
            {(w,h) => <WaterfallChart filters={filters} w={w} h={h}/>}
          </ChartBox>
        </Card>

        {/* Row 3: JBP Scorecard */}
        <JBPScorecard filters={filters}/>

      </div>
    </div>
  );
}