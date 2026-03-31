import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ScatterChart, Scatter, ZAxis, Legend,
} from "recharts";
import { useFilters } from "../context/FilterContext";
import { MARS } from "../data/mockData";

const PURPLE = "#5500bb";

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
function ChartBox({ height=220, children }) {
  const ref = useRef(null);
  const w   = useWidth(ref);
  return <div ref={ref} style={{width:"100%",overflow:"hidden"}}>{w>10 && children(w,height)}</div>;
}

// ── ATOMS ─────────────────────────────────────────────────────────────────────
const Card = ({children,style}) => (
  <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e8f4",boxShadow:"0 2px 10px rgba(0,0,160,.05)",...style}}>
    {children}
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
const Badge = ({children,type="green"}) => {
  const c={green:{bg:"#d4f5e2",color:"#1a7a40"},red:{bg:"#fde8ec",color:MARS.red},gold:{bg:"#fff3d0",color:"#a07000"},blue:{bg:"#dde8ff",color:"#1a3c8e"},gray:{bg:"#f0f0f0",color:"#555"}}[type]||{};
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontFamily:"'MarsBold',system-ui",background:c.bg,color:c.color}}>{children}</span>;
};

function KPICard({label,value,changeLabel,sub,changeUp=true}) {
  return (
    <Card style={{padding:"14px 16px",flex:"1 1 0",minWidth:0,borderTop:`3px solid ${PURPLE}`}}>
      <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontFamily:"'MarsExtrabold',system-ui",color:"#1a1a2e",lineHeight:1,marginBottom:6}}>{value}</div>
      {changeLabel&&<div style={{fontSize:10,fontFamily:"'MarsBold',system-ui",color:changeUp?"#00967a":MARS.red,background:changeUp?"#e0f7f2":"#fff1f0",borderRadius:20,padding:"1px 8px",display:"inline-block",marginBottom:4}}>{changeLabel}</div>}
      {sub&&<div style={{fontSize:10,color:"#8b8fb8",marginTop:2}}>{sub}</div>}
    </Card>
  );
}

// ── EXPAND + MODAL ────────────────────────────────────────────────────────────
function ExpandBtn({onClick}) {
  return (
    <button onClick={onClick}
      style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${MARS.blue}30`,background:`${MARS.blue}08`,fontSize:10,fontFamily:"'MarsBold',system-ui",color:MARS.blue,cursor:"pointer",transition:"all .15s",flexShrink:0}}
      onMouseOver={e=>{e.currentTarget.style.background=MARS.blue;e.currentTarget.style.color="#fff";}}
      onMouseOut={e=>{e.currentTarget.style.background=`${MARS.blue}08`;e.currentTarget.style.color=MARS.blue;}}>
      ⤢ Expand
    </button>
  );
}
function Modal({title,subtitle,onClose,children}) {
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

// Card header with optional right-side controls + expand
function CardHeader({title,sub,onExpand,right}) {
  return(
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
      <div>
        <div style={{fontSize:13,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e"}}>{title}</div>
        {sub&&<div style={{fontSize:10,color:"#8b8fb8",marginTop:2}}>{sub}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:8}}>
        {right}
        <ExpandBtn onClick={onExpand}/>
      </div>
    </div>
  );
}

// ── PACK-PRICE DATA ────────────────────────────────────────────────────────────
const BRANDS_LIST = ["Snickers","M&M's","Twix","Skittles","Starburst"];
const PACK_DATA = {
  Snickers: {
    headers:["Single 1.86oz","Share 3.29oz","King Size 4oz","Mini Bag 8oz","Club 52oz"],
    channels:["Convenience","Mass","Grocery","Drug","E-Commerce"],
    cells:[
      [{s:"optimal",p:"$1.79",ppu:"$0.96/oz"},{s:"optimal",p:"$2.99",ppu:"$0.91/oz"},{s:"overlap",p:"$3.49",ppu:"$0.87/oz"},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""}],
      [{s:"optimal",p:"$1.79",ppu:"$0.96/oz"},{s:"optimal",p:"$2.99",ppu:"$0.91/oz"},{s:"optimal",p:"$3.49",ppu:"$0.87/oz"},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""}],
      [{s:"optimal",p:"$1.79",ppu:"$0.96/oz"},{s:"optimal",p:"$2.99",ppu:"$0.91/oz"},{s:"optimal",p:"$3.49",ppu:"$0.87/oz"},{s:"gap",p:"$7.99?",ppu:"$1.00/oz"},{s:"gap",p:"$14.99?",ppu:"$0.29/oz"}],
      [{s:"optimal",p:"$1.99",ppu:"$1.07/oz"},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""}],
      [{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"optimal",p:"$3.49",ppu:"$0.87/oz"},{s:"gap",p:"$7.99?",ppu:"$1.00/oz"},{s:"gap",p:"$14.99?",ppu:"$0.29/oz"}],
    ],
  },
  "M&M's": {
    headers:["Single 1.69oz","Share 3.14oz","Party Size 38oz","Mini Bag 8oz","Club 62oz"],
    channels:["Convenience","Mass","Grocery","Drug","E-Commerce"],
    cells:[
      [{s:"optimal",p:"$1.89",ppu:"$1.12/oz"},{s:"optimal",p:"$3.29",ppu:"$1.05/oz"},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""}],
      [{s:"optimal",p:"$1.89",ppu:"$1.12/oz"},{s:"optimal",p:"$3.29",ppu:"$1.05/oz"},{s:"optimal",p:"$9.99",ppu:"$0.26/oz"},{s:"empty",p:"—",ppu:""},{s:"gap",p:"$14.99?",ppu:"$0.24/oz"}],
      [{s:"optimal",p:"$1.89",ppu:"$1.12/oz"},{s:"optimal",p:"$3.29",ppu:"$1.05/oz"},{s:"optimal",p:"$9.99",ppu:"$0.26/oz"},{s:"gap",p:"$6.99?",ppu:"$0.87/oz"},{s:"gap",p:"$14.99?",ppu:"$0.24/oz"}],
      [{s:"optimal",p:"$1.99",ppu:"$1.18/oz"},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""}],
      [{s:"empty",p:"—",ppu:""},{s:"optimal",p:"$3.49",ppu:"$1.11/oz"},{s:"optimal",p:"$9.99",ppu:"$0.26/oz"},{s:"empty",p:"—",ppu:""},{s:"gap",p:"$14.99?",ppu:"$0.24/oz"}],
    ],
  },
  Twix: {
    headers:["Single 1.79oz","Share 3.02oz","King Size 4oz","Value Pack 18ct","Club 36ct"],
    channels:["Convenience","Mass","Grocery","Drug","E-Commerce"],
    cells:[
      [{s:"optimal",p:"$1.89",ppu:"$1.06/oz"},{s:"optimal",p:"$2.99",ppu:"$0.99/oz"},{s:"overlap",p:"$3.49",ppu:"$0.87/oz"},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""}],
      [{s:"optimal",p:"$1.89",ppu:"$1.06/oz"},{s:"optimal",p:"$2.99",ppu:"$0.99/oz"},{s:"optimal",p:"$3.49",ppu:"$0.87/oz"},{s:"gap",p:"$9.99?",ppu:"$0.56/oz"},{s:"empty",p:"—",ppu:""}],
      [{s:"optimal",p:"$1.89",ppu:"$1.06/oz"},{s:"optimal",p:"$2.99",ppu:"$0.99/oz"},{s:"optimal",p:"$3.49",ppu:"$0.87/oz"},{s:"gap",p:"$9.99?",ppu:"$0.56/oz"},{s:"gap",p:"$16.99?",ppu:"$0.47/oz"}],
      [{s:"overlap",p:"$2.09",ppu:"$1.17/oz"},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""}],
      [{s:"empty",p:"—",ppu:""},{s:"empty",p:"—",ppu:""},{s:"optimal",p:"$3.49",ppu:"$0.87/oz"},{s:"empty",p:"—",ppu:""},{s:"gap",p:"$16.99?",ppu:"$0.47/oz"}],
    ],
  },
};
const STATUS_STYLE = {
  optimal:{bg:"#d4f5e2",border:"#1a7a40",label:"Optimal"},
  gap:    {bg:"#fffbf0",border:"#d4a017",label:"Gap"},
  overlap:{bg:"#fff5f5",border:MARS.red,  label:"Overlap"},
  empty:  {bg:"#f8f9fb",border:"#eee",    label:"—"},
};

function PackPriceMatrixContent({filters,brand,setBrand}) {
  const d = PACK_DATA[brand] || PACK_DATA["Snickers"];
  return(
    <>
      <div style={{display:"flex",gap:14,marginBottom:12,flexWrap:"wrap"}}>
        {Object.entries(STATUS_STYLE).filter(([k])=>k!=="empty").map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
            <span style={{width:12,height:12,borderRadius:3,background:v.bg,border:`2px solid ${v.border}`,display:"inline-block"}}/>
            {v.label}
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
          <span style={{width:12,height:12,borderRadius:3,background:"#f8f9fb",border:"2px solid #eee",display:"inline-block"}}/>
          Not Present
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:`120px repeat(${d.headers.length},1fr)`,gap:5,minWidth:580}}>
          <div style={{padding:"7px 8px",background:"#f4f4fc",borderRadius:6}}/>
          {d.headers.map(h=><div key={h} style={{padding:"7px 6px",background:"#f4f4fc",borderRadius:6,fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textAlign:"center",lineHeight:1.3}}>{h}</div>)}
          {d.channels.map((ch,ri)=>(
            <>
              <div key={ch} style={{padding:"10px 8px",background:"#f4f4fc",borderRadius:6,fontSize:11,fontFamily:"'MarsBold',system-ui",color:"#1a1a2e",display:"flex",alignItems:"center"}}>{ch}</div>
              {d.cells[ri].map((cell,ci)=>{
                const st=STATUS_STYLE[cell.s]||STATUS_STYLE.empty;
                const clickable=cell.s!=="empty";
                return(
                  <div key={ci} style={{padding:"8px 6px",borderRadius:8,background:st.bg,border:`2px solid ${st.border}`,textAlign:"center",cursor:clickable?"pointer":"default",transition:"transform .15s"}}
                    onClick={()=>{if(clickable)alert(`${brand} · ${ch} · ${d.headers[ci]}\nPrice: ${cell.p}\nPrice per unit: ${cell.ppu}\nStatus: ${st.label}`);}}
                    onMouseOver={e=>{if(clickable)e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseOut={e=>{e.currentTarget.style.transform="none";}}>
                    <div style={{fontSize:12,fontFamily:"'MarsBold',system-ui",color:cell.s==="empty"?"#ccc":"#1a1a2e"}}>{cell.p}</div>
                    {cell.ppu&&<div style={{fontSize:9,color:"#8b8fb8",marginTop:2}}>{cell.ppu}</div>}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </>
  );
}

// ── OCCASION SEGMENTATION ──────────────────────────────────────────────────────
// Fix: bottom margin increased so x-axis label doesn't overlap legend
// Legend moved to top so it doesn't crowd the x-axis label at bottom
function OccasionChart({ filters, w, h }) {
  const s = hash(`occ-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Category}`);
  const data = [
    {name:"Single (Impulse)",    x:parseFloat(vary(30,s+1, 0.25).toFixed(1)),y:parseFloat(vary(85,s+2, 0.12).toFixed(0)),r:parseFloat(vary(15,s+3, 0.20).toFixed(0)),color:"rgba(200,16,46,.7)"},
    {name:"Share Size (Sharing)",x:parseFloat(vary(55,s+4, 0.20).toFixed(1)),y:parseFloat(vary(72,s+5, 0.12).toFixed(0)),r:parseFloat(vary(20,s+6, 0.20).toFixed(0)),color:"rgba(230,126,34,.7)"},
    {name:"King Size (Indulge)", x:parseFloat(vary(70,s+7, 0.18).toFixed(1)),y:parseFloat(vary(61,s+8, 0.12).toFixed(0)),r:parseFloat(vary(18,s+9, 0.20).toFixed(0)),color:"rgba(15,52,96,.7)"},
    {name:"Mini Bag (Gifting)",  x:parseFloat(vary(45,s+10,0.22).toFixed(1)),y:parseFloat(vary(88,s+11,0.10).toFixed(0)),r:parseFloat(vary(12,s+12,0.22).toFixed(0)),color:"rgba(142,68,173,.7)"},
    {name:"Club Pack (Pantry)",  x:parseFloat(vary(80,s+13,0.18).toFixed(1)),y:parseFloat(vary(55,s+14,0.14).toFixed(0)),r:parseFloat(vary(25,s+15,0.20).toFixed(0)),color:"rgba(39,174,96,.7)"},
  ];
  const CustomTooltip = ({active,payload}) => {
    if (!active||!payload?.length) return null;
    const d=payload[0].payload;
    return(
      <div style={{background:"#fff",border:`1.5px solid ${MARS.blue}30`,borderRadius:10,padding:"10px 14px",boxShadow:"0 4px 20px rgba(0,0,160,.1)",fontSize:12}}>
        <div style={{fontFamily:"'MarsBold',system-ui",color:"#1a1a2e",marginBottom:4}}>{d.name}</div>
        <div style={{color:"#8b8fb8"}}>Occasion Freq: <strong style={{color:"#1a1a2e"}}>{d.x}%</strong></div>
        <div style={{color:"#8b8fb8"}}>Consumer Fit: <strong style={{color:"#1a1a2e"}}>{d.y}/100</strong></div>
      </div>
    );
  };
  return(
    // Legend at top, x-axis label at bottom with enough margin — no overlap
    <ScatterChart width={w} height={h} margin={{top:8,right:24,left:10,bottom:30}}>
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4"/>
      <XAxis type="number" dataKey="x" name="Occasion Frequency"
        tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={{stroke:"#e0e0f0"}} tickLine={false}
        label={{value:"Occasion Frequency %",position:"insideBottom",offset:-16,fontSize:10,fill:"#8b8fb8"}}/>
      <YAxis type="number" dataKey="y" name="Consumer Fit"
        tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={false} tickLine={false}
        label={{value:"Consumer Fit Score",angle:-90,position:"insideLeft",offset:12,fontSize:10,fill:"#8b8fb8"}}/>
      <ZAxis type="number" dataKey="r" range={[300,2000]}/>
      <Tooltip content={<CustomTooltip/>}/>
      {/* Legend at top to avoid crowding x-axis label */}
      <Legend verticalAlign="top" iconType="circle" iconSize={8}
        wrapperStyle={{fontSize:9,fontFamily:"'MarsBold',system-ui",paddingBottom:6}}
        payload={data.map(d=>({value:d.name,type:"circle",color:d.color}))}/>
      {data.map((d,i)=>(
        <Scatter key={i} name={d.name} data={[d]}
          shape={props=>{
            const{cx,cy}=props;
            const radius=8+Math.sqrt(d.r)*1.8;
            return(
              <g>
                <circle cx={cx} cy={cy} r={radius} fill={d.color} stroke="rgba(255,255,255,.6)" strokeWidth={1.5}/>
                <text x={cx} y={cy-radius-4} textAnchor="middle" style={{fontSize:8,fill:"#3a3a5c",fontFamily:"'MarsBold',system-ui"}}>{d.name.split(" ")[0]}</text>
              </g>
            );
          }}/>
      ))}
    </ScatterChart>
  );
}

// ── CANNIBALIZATION ANALYSIS ──────────────────────────────────────────────────
// Fix: bottom margin large enough so x-axis label doesn't overlap legend
// Legend at top, short series names to prevent wrapping
function CannibalChart({ filters, w, h }) {
  const s = hash(`cannibal-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Category}`);
  const packs = ["Single","Share Size","King Size","Mini Bag"];
  const data = packs.map((pack,i)=>({
    pack,
    "New Buyers":       Math.round(vary([72,68,61,79][i],s+i,    0.15)),
    "Mars Switch":      Math.round(vary([12,18,24,10][i],s+i+10, 0.25)),
    "Comp Switch":      Math.round(vary([16,14,15,11][i],s+i+20, 0.20)),
  }));
  return(
    <BarChart width={w} height={h} data={data} margin={{top:8,right:20,left:10,bottom:20}}>
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4"/>
      <XAxis dataKey="pack" tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={{stroke:"#e0e0f0"}} tickLine={false}/>
      <YAxis tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:"#8b8fb8"}} axisLine={false} tickLine={false} domain={[0,100]}/>
      <Tooltip formatter={(v,n)=>[`${v}%`,n]} contentStyle={{fontSize:12,borderRadius:8}}/>
      {/* Legend at top, short names — no overlap with axis */}
      <Legend verticalAlign="top" iconType="circle" iconSize={8}
        wrapperStyle={{fontSize:10,fontFamily:"'MarsBold',system-ui",paddingBottom:6}}/>
      <Bar dataKey="New Buyers"  name="New Buyers"  stackId="a" fill="#27ae60" radius={[0,0,0,0]}/>
      <Bar dataKey="Mars Switch" name="Mars Switch" stackId="a" fill="#f0a500"/>
      <Bar dataKey="Comp Switch" name="Comp Switch" stackId="a" fill="#0f3460" radius={[4,4,0,0]}/>
    </BarChart>
  );
}

// ── PORTFOLIO GAP TABLE ────────────────────────────────────────────────────────
function PortfolioGapTable({filters}) {
  const s=hash(`gap-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Category}-${filters.Retailer}`);
  const base=[
    {brand:"M&M's",   pack:"Club Pack 52oz",    channel:"Club / Wholesale", occasion:"Pantry Loading",    wtp:"$14.99",rev:12.4,invest:0.8,payback:10,priority:"green"},
    {brand:"Snickers",pack:"Mini Bag 8oz",      channel:"E-Commerce",       occasion:"Sharing / Gifting", wtp:"$5.99", rev:7.8, invest:0.4,payback:8, priority:"green"},
    {brand:"Skittles",pack:"Share Size 4oz",    channel:"Convenience",      occasion:"On-the-go Sharing", wtp:"$2.49", rev:5.2, invest:0.3,payback:14,priority:"gold"},
    {brand:"Twix",    pack:"Value Pack 18ct",   channel:"Drug / Dollar",    occasion:"Value Stock-up",    wtp:"$9.99", rev:3.6, invest:0.5,payback:18,priority:"gold"},
    {brand:"Galaxy",  pack:"Gifting Box 200g",  channel:"Grocery / Online", occasion:"Gifting",           wtp:"$8.49", rev:2.8, invest:0.6,payback:22,priority:"gray"},
  ];
  const data=base.map((r,i)=>({...r,rev:parseFloat(vary(r.rev,s+i,0.22).toFixed(1)),invest:parseFloat(vary(r.invest,s+i+10,0.18).toFixed(1)),payback:Math.round(vary(r.payback,s+i+20,0.15))}));
  const th={padding:"8px 10px",textAlign:"left",fontSize:9,fontFamily:"'MarsBold',system-ui",color:"#8b8fb8",textTransform:"uppercase",letterSpacing:".06em",background:"#f8f8fc",borderBottom:"2px solid #e8e8f4",whiteSpace:"nowrap"};
  const td={padding:"9px 10px",fontSize:11,borderBottom:"1px solid #f0f0f8",whiteSpace:"nowrap"};
  return(
    <>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Brand","Missing Pack","Target Channel","Occasion","Consumer WTP","Est. Revenue","Investment Req.","Payback","Priority"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{data.map((r,i)=>(
            <tr key={i} style={{background:i%2===0?"#fff":"#f9f9fc"}} onMouseOver={e=>e.currentTarget.style.background=`${MARS.blue}06`} onMouseOut={e=>e.currentTarget.style.background=i%2===0?"#fff":"#f9f9fc"}>
              <td style={{...td,fontFamily:"'MarsBold',system-ui",color:MARS.blue}}>{r.brand}</td>
              <td style={td}>{r.pack}</td><td style={td}>{r.channel}</td><td style={td}>{r.occasion}</td>
              <td style={{...td,fontFamily:"'MarsBold',system-ui"}}>{r.wtp}</td>
              <td style={td}><span style={{fontFamily:"'MarsBold',system-ui",color:r.rev>=7?"#1a7a40":r.rev>=4?"#a07000":"#555",background:r.rev>=7?"#d4f5e2":r.rev>=4?"#fff3d0":"#f0f0f0",borderRadius:20,padding:"2px 8px",fontSize:10}}>+${r.rev}M</span></td>
              <td style={td}>${r.invest}M</td>
              <td style={td}>{r.payback} months</td>
              <td style={td}><Badge type={r.priority}>{r.priority==="green"?"High":r.priority==="gold"?"Medium":"Low"}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:10,marginTop:14,padding:"10px 14px",background:"#f0f7ff",borderLeft:"3px solid #1a5fb4",borderRadius:"0 8px 8px 0"}}>
        <div style={{fontSize:11,color:"#1a3c5e"}}>
          <span style={{fontFamily:"'MarsBold',system-ui",color:"#1a5fb4"}}>Total opportunity: </span>
          +${data.reduce((a,r)=>a+r.rev,0).toFixed(1)}M revenue across {data.length} unfilled pack-channel slots · Avg payback: {Math.round(data.reduce((a,r)=>a+r.payback,0)/data.length)} months
        </div>
      </div>
    </>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function AssortmentMixPage() {
  const { filters } = useFilters();
  const [brand,    setBrand]    = useState("Snickers");
  const [expanded, setExpanded] = useState(null);
  const sub = `${filters.Market} · ${filters.Period} ${filters.Year}`;

  const s = hash(`assort-kpi-${filters.Market}-${filters.Period}-${filters.Year}-${filters.Category}-${filters.Retailer}`);
  const kpis = [
    { label:"Portfolio Gaps Identified", value:String(Math.round(vary(4,s+1,0.50))), changeLabel:"Unfilled occasion / channel slots", sub:`Revenue opportunity: +$${vary(28,s+10,0.25).toFixed(0)}M`, changeUp:false },
    { label:"Price-per-oz Range", value:`$${vary(0.62,s+2,0.12).toFixed(2)} – $${vary(1.18,s+3,0.10).toFixed(2)}`, changeLabel:"Across pack types", sub:`Club: $${vary(0.62,s+4,0.10).toFixed(2)} · Impulse: $${vary(1.18,s+5,0.08).toFixed(2)}`, changeUp:true },
    { label:"Channel Mix Shift", value:`+${vary(3.2,s+6,0.30).toFixed(1)}pp`, changeLabel:"▲ Club / E-Comm gaining", sub:`Convenience -${vary(1.8,s+7,0.28).toFixed(1)}pp YA`, changeUp:true },
  ];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"#f0f2f8",overflow:"hidden",minWidth:0,minHeight:0}}>

      {/* Modals */}
      {expanded==="matrix" && (
        <Modal title="Pack-Price Architecture Matrix" subtitle={`Pack size × Channel · ${brand} · ${sub}`} onClose={()=>setExpanded(null)}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <select value={brand} onChange={e=>setBrand(e.target.value)} style={{padding:"5px 10px",borderRadius:7,border:"1px solid #e8e8f4",fontSize:12,color:"#1a1a2e",background:"#f8f8fc",fontFamily:"inherit",cursor:"pointer"}}>
              {BRANDS_LIST.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <PackPriceMatrixContent filters={filters} brand={brand} setBrand={setBrand}/>
        </Modal>
      )}
      {expanded==="occasion" && (
        <Modal title="Occasion Segmentation" subtitle={`Pack type vs consumer occasion fit · ${sub}`} onClose={()=>setExpanded(null)}>
          <ChartBox height={500}>{(w,h)=><OccasionChart filters={filters} w={w} h={h}/>}</ChartBox>
        </Modal>
      )}
      {expanded==="cannibal" && (
        <Modal title="Cannibalization Analysis" subtitle={`Volume switching between pack types · ${sub}`} onClose={()=>setExpanded(null)}>
          <ChartBox height={460}>{(w,h)=><CannibalChart filters={filters} w={w} h={h}/>}</ChartBox>
        </Modal>
      )}
      {expanded==="gap" && (
        <Modal title="Portfolio Gap Analysis — Revenue Opportunity" subtitle={`Missing pack-channel combinations · ${sub}`} onClose={()=>setExpanded(null)}>
          <PortfolioGapTable filters={filters}/>
        </Modal>
      )}

      {/* Page header */}
      <div style={{padding:"14px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:4,height:20,background:MARS.yellow,borderRadius:2}}/>
          <span style={{fontFamily:"'MarsExtrabold',system-ui",fontSize:15,color:MARS.blue}}>Assortment &amp; Mix</span>
          <span style={{fontSize:11,color:"#8b8fb8"}}>· {filters.Market} · {filters.Period} {filters.Year}</span>
        </div>
        <InsightBox type="info" title="🎯 Key Decision">
          What is the right portfolio of pack sizes and price points to serve impulse, sharing, and pantry-loading occasions across channels with minimal gaps?
        </InsightBox>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:14}}>

        {/* KPIs */}
        <div style={{display:"flex",gap:10}}>
          {kpis.map((k,i)=><KPICard key={i} {...k}/>)}
        </div>

        {/* Row 1: Pack-Price Matrix */}
        <Card style={{padding:"16px 18px"}}>
          <CardHeader
            title="Pack-Price Architecture Matrix"
            sub="Pack size × Channel · Click cell for detail · Color = architecture health"
            onExpand={()=>setExpanded("matrix")}
            right={
              <select value={brand} onChange={e=>setBrand(e.target.value)}
                style={{padding:"5px 10px",borderRadius:7,border:"1px solid #e8e8f4",fontSize:12,color:"#1a1a2e",background:"#f8f8fc",fontFamily:"inherit",cursor:"pointer"}}>
                {BRANDS_LIST.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            }
          />
          <PackPriceMatrixContent filters={filters} brand={brand} setBrand={setBrand}/>
        </Card>

        {/* Row 2: Occasion + Cannibalization */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card style={{padding:"16px 18px"}}>
            <CardHeader
              title="Occasion Segmentation"
              sub="Pack type vs consumer occasion fit · Bubble size = frequency"
              onExpand={()=>setExpanded("occasion")}
            />
            {/* Taller height so legend (top) + chart + x-axis label (bottom) all fit */}
            <ChartBox height={270}>{(w,h)=><OccasionChart filters={filters} w={w} h={h}/>}</ChartBox>
          </Card>

          <Card style={{padding:"16px 18px"}}>
            <CardHeader
              title="Cannibalization Analysis"
              sub="Volume switching between pack types · Stacked by buyer source"
              onExpand={()=>setExpanded("cannibal")}
            />
            <ChartBox height={260}>{(w,h)=><CannibalChart filters={filters} w={w} h={h}/>}</ChartBox>
            <div style={{marginTop:10,padding:"10px 12px",background:"#fffbf0",borderLeft:"3px solid #d4a017",borderRadius:"0 8px 8px 0",fontSize:11,color:"#5a3e00"}}>
              <div style={{fontSize:9,fontFamily:"'MarsBold',system-ui",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,color:"#a07000"}}>⚠ Switching Detected</div>
              Share Size cannibalising Single at elevated rate in Mass channel. Recommend +$0.10 price gap to restore architecture.
            </div>
          </Card>
        </div>

        {/* Row 3: Portfolio Gap */}
        <Card style={{padding:"16px 18px"}}>
          <CardHeader
            title="Portfolio Gap Analysis — Revenue Opportunity"
            sub="Missing pack-channel combinations with modelled revenue upside"
            onExpand={()=>setExpanded("gap")}
          />
          <PortfolioGapTable filters={filters}/>
        </Card>

      </div>
    </div>
  );
}