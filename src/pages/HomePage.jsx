import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import { useFilters } from "../context/FilterContext";
import { useAuth }    from "../context/AuthContext";
import { MARS } from "../data/mockData";

const PURPLE = "#5500bb";

function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r && r.width > 0) setW(Math.floor(r.width));
    });
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      if (r.width > 0) setW(Math.floor(r.width));
      ro.observe(ref.current);
    }
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return Math.abs(h); };
const sr   = seed => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const vary = (base, seed, range = 0.15) => parseFloat((base * (1 + (sr(seed) - 0.5) * range)).toFixed(2));

const BRANDS       = ["Snickers", "M&M's", "Twix", "Skittles", "Starburst"];
const BRAND_COLORS = [MARS.blue, MARS.orange, "#00967a", "#5500bb", MARS.red];

const getHomeData = (filters) => {
  const s = hash(`home-${filters.Market}-${filters.Year}-${filters.Period}-${filters.Region}`);
  const revActual = vary(2340, s+1, 0.18);
  const revPlan   = vary(2270, s+2, 0.08);
  const revGrowth = parseFloat(((revActual / revPlan - 1) * 100).toFixed(1));
  const tradeRoi  = vary(1.24, s+4, 0.12);
  const priceReal = vary(96.2, s+5, 0.06);

  const kpis = [
    { label:"Revenue vs Plan",   value:`$${(revActual/100).toFixed(2)}B`, change:revGrowth, changeLabel:"vs YA", sub:`Plan: $${(revPlan/100).toFixed(2)}B`, up: revGrowth >= 0 },
    { label:"Trade ROI",         value:`${tradeRoi}x`, change:parseFloat(vary(0.08,s+11,0.5).toFixed(2)), changeLabel:"vs YA", sub:`Benchmark: 1.15x`, up: tradeRoi >= 1.15 },
    { label:"Price Realization", value:`${priceReal}%`, change:parseFloat(vary(-1.4,s+12,0.6).toFixed(1)), changeLabel:"pp vs YA", sub:`List to net efficiency`, up: priceReal >= 95 },
  ];

  const waterfall = BRANDS.map((brand, i) => {
    const base   = Math.round(vary(820 - i * 130, s + i + 20, 0.12));
    const growth = Math.round(vary(i === 3 ? -8 : 30 - i * 4, s + i + 30, 0.40));
    return { brand, base, uplift: growth >= 0 ? growth : 0, loss: growth < 0 ? Math.abs(growth) : 0, growth };
  });

  const brandMix = BRANDS.map((brand, i) => ({
    name: brand, value: Math.round(vary([35,26,20,12,7][i], s+i+40, 0.25)), color: BRAND_COLORS[i],
  }));

  const bridgeRaw = [
    { name:"Base",       val: Math.round(vary(2200, s+50, 0.08)), isTotal: true  },
    { name:"Price",      val: Math.round(vary(48,   s+51, 0.40)), isTotal: false },
    { name:"Volume",     val: Math.round(vary(-22,  s+52, 0.40)), isTotal: false },
    { name:"Mix",        val: Math.round(vary(18,   s+53, 0.50)), isTotal: false },
    { name:"Innovation", val: Math.round(vary(34,   s+54, 0.40)), isTotal: false },
    { name:"Total",      val: Math.round(vary(2278, s+55, 0.08)), isTotal: true  },
  ];
  let running = 0;
  const bridge = bridgeRaw.map((item) => {
    if (item.isTotal) { running = item.val; return { ...item, spacer: 0, bar: item.val, barColor: item.name === "Base" ? "#6b7280" : "#1a1a2e" }; }
    const spacer = item.val >= 0 ? running : running + item.val;
    const bar    = Math.abs(item.val);
    running     += item.val;
    return { ...item, spacer, bar, barColor: item.val >= 0 ? "#00967a" : MARS.red };
  });

  const health = [
    { label:"Pricing",    score: Math.round(vary(78, s+60, 0.15)) },
    { label:"Promo ROI",  score: Math.round(vary(62, s+61, 0.18)) },
    { label:"Trade Spend",score: Math.round(vary(71, s+62, 0.15)) },
    { label:"Pack-Price", score: Math.round(vary(55, s+63, 0.18)) },
    { label:"SKU Mix",    score: Math.round(vary(43, s+64, 0.20)) },
  ];

  const actions = [
    { icon:"🔴", title:`${BRANDS[Math.floor(sr(s+70)*5)]}: Promo ROI below target`, sub:`${Math.round(vary(3,s+71,0.4))} promos below breakeven · Review required` },
    { icon:"🟡", title:`${BRANDS[Math.floor(sr(s+72)*5)]}: Price gap widening`, sub:`Price vs competitor widened · Elasticity risk` },
    { icon:"🟢", title:`M&M's Club Pack opportunity`, sub:`+$${Math.round(vary(12,s+73,0.3))}M revenue if gap filled` },
    { icon:"🟡", title:`${Math.round(vary(12,s+74,0.3))} SKUs below velocity threshold`, sub:`Rationalization decision needed · Q3 cycle` },
  ];

  return { kpis, waterfall, brandMix, bridge, health, actions };
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,30,.75)", backdropFilter:"blur(6px)" }} />
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

// ─── EXPAND BUTTON ────────────────────────────────────────────────────────────
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

const Card = ({ children, style }) => (
  <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e8e8f4", boxShadow:"0 2px 10px rgba(0,0,160,.05)", ...style }}>
    {children}
  </div>
);

function KPICard({ kpi }) {
  return (
    <Card style={{ padding:"14px 16px", flex:"1 1 0", minWidth:0, borderTop:`3px solid ${PURPLE}` }}>
      <div style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>{kpi.label}</div>
      <div style={{ fontSize:22, fontFamily:"'MarsExtrabold',system-ui", color:"#1a1a2e", lineHeight:1, marginBottom:6 }}>{kpi.value}</div>
      <span style={{ fontSize:10, fontFamily:"'MarsBold',system-ui", color:kpi.up?"#00967a":MARS.red, background:kpi.up?"#e0f7f2":"#fff1f0", borderRadius:20, padding:"1px 8px" }}>
        {kpi.up ? "▲" : "▼"} {Math.abs(kpi.change)}{kpi.changeLabel?.includes("pp")?"pp":"%"} {kpi.changeLabel?.replace("pp","").replace("%","")}
      </span>
      <div style={{ fontSize:10, color:"#8b8fb8", marginTop:6 }}>{kpi.sub}</div>
    </Card>
  );
}

function ChartBox({ children, height = 200 }) {
  const ref = useRef(null);
  const w   = useWidth(ref);
  return (
    <div ref={ref} style={{ width:"100%", overflow:"hidden" }}>
      {w > 10 && children(w, height)}
    </div>
  );
}

function RevenueWaterfallChart({ data, w, h }) {
  const chartData = data.map(d => ({
    brand: d.brand, growth: d.growth, base: d.base, uplift: d.uplift,
    lossDrop: d.loss > 0 ? -d.loss : 0,
  }));
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div style={{ background:"#fff", border:"1.5px solid #e8e8f4", borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 20px rgba(0,0,160,.12)", fontSize:12 }}>
        <div style={{ fontFamily:"'MarsBold',system-ui", color:"#1a1a2e", marginBottom:6 }}>{d.brand}</div>
        <span style={{ fontSize:11, color:"#8b8fb8" }}>Base: <strong style={{ color:"#1a1a2e" }}>${d.base}M</strong></span><br/>
        {d.uplift > 0 && <span style={{ fontSize:11, color:"#00967a", fontFamily:"'MarsBold',system-ui" }}>▲ Uplift: +${d.uplift}M</span>}
        {d.lossDrop < 0 && <span style={{ fontSize:11, color:MARS.red, fontFamily:"'MarsBold',system-ui" }}>▼ Loss: -${Math.abs(d.lossDrop)}M</span>}
      </div>
    );
  };
  return (
    <BarChart width={w} height={h} data={chartData} margin={{ top:24, right:16, left:10, bottom:5 }} barCategoryGap="30%" stackOffset="sign">
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4" vertical={false} />
      <XAxis dataKey="brand" tick={{ fontSize:10, fill:"#8b8fb8" }} axisLine={{ stroke:"#e0e0f0" }} tickLine={false} />
      <YAxis tick={{ fontSize:10, fill:"#8b8fb8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="base"     stackId="a" fill="#b0b4c8" radius={[0,0,0,0]} legendType="none" />
      <Bar dataKey="uplift"   stackId="a" fill="#00967a" radius={[4,4,0,0]} label={{ position:"top", fontSize:9, fontFamily:"'MarsBold',system-ui", fill:"#00967a", formatter: v => v > 0 ? `+$${v}M` : "" }} />
      <Bar dataKey="lossDrop" stackId="a" fill={MARS.red} radius={[0,0,4,4]} label={{ position:"bottom", fontSize:9, fontFamily:"'MarsBold',system-ui", fill:MARS.red, formatter: v => v < 0 ? `-$${Math.abs(v)}M` : "" }} />
    </BarChart>
  );
}

function BrandMixChart({ data, w, h }) {
  return (
    <PieChart width={w} height={h}>
      <Pie data={data} cx="50%" cy="50%" innerRadius={h*0.26} outerRadius={h*0.42} dataKey="value" nameKey="name" paddingAngle={1}>
        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
      </Pie>
      <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize:12, borderRadius:8 }} />
      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:10, fontFamily:"'MarsBold',system-ui" }} />
    </PieChart>
  );
}

function BridgeWaterfallChart({ data, w, h }) {
  const BridgeTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload.find(p => p.dataKey === "bar")?.payload;
    if (!d) return null;
    return (
      <div style={{ background:"#fff", border:"1.5px solid #e8e8f4", borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 20px rgba(0,0,160,.12)", fontSize:12 }}>
        <div style={{ fontFamily:"'MarsBold',system-ui", color:"#1a1a2e", marginBottom:4 }}>{d.name}</div>
        <div style={{ fontFamily:"'MarsBold',system-ui", color: d.isTotal ? "#1a1a2e" : d.val >= 0 ? "#00967a" : MARS.red, fontSize:14 }}>
          {d.isTotal ? `$${d.val}M` : `${d.val >= 0 ? "+" : ""}$${d.val}M`}
        </div>
      </div>
    );
  };
  return (
    <BarChart width={w} height={h} data={data} margin={{ top:28, right:16, left:10, bottom:5 }} barCategoryGap="20%">
      <CartesianGrid strokeDasharray="4 4" stroke="#ebebf4" vertical={false} />
      <XAxis dataKey="name" tick={{ fontSize:10, fill:"#8b8fb8" }} axisLine={{ stroke:"#e0e0f0" }} tickLine={false} />
      <YAxis tick={{ fontSize:10, fill:"#8b8fb8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
      <Tooltip content={<BridgeTip />} />
      <Bar dataKey="spacer" stackId="wf" fill="transparent" legendType="none" />
      <Bar dataKey="bar" stackId="wf" radius={[4,4,0,0]}
        label={{ position:"top", fontSize:9, fontFamily:"'MarsBold',system-ui", fill:"#6b6b80",
          formatter: (v, entry) => { const d = entry?.payload; if (!d) return ""; if (d.isTotal) return `$${d.val}M`; return `${d.val >= 0 ? "+" : ""}$${d.val}M`; }
        }}>
        {data.map((d, i) => <Cell key={i} fill={d.barColor} />)}
      </Bar>
    </BarChart>
  );
}

function HealthScores({ data }) {
  const colorFor = score => score >= 70 ? "#00967a" : score >= 55 ? "#d4a017" : MARS.red;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {data.map(item => (
        <div key={item.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:88, fontSize:11, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e", flexShrink:0 }}>{item.label}</div>
          <div style={{ flex:1, height:8, background:"#e8e8f4", borderRadius:4, overflow:"hidden" }}>
            <div style={{ width:`${item.score}%`, height:"100%", background:colorFor(item.score), borderRadius:4, transition:"width .6s" }} />
          </div>
          <div style={{ width:32, textAlign:"right", fontSize:11, fontFamily:"'MarsBold',system-ui", color:colorFor(item.score) }}>{item.score}</div>
        </div>
      ))}
    </div>
  );
}

function PriorityActions({ actions }) {
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {actions.map((a, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom: i < actions.length-1 ? "1px solid #f0f0f8" : "none" }}>
          <span style={{ fontSize:18, flexShrink:0 }}>{a.icon}</span>
          <div>
            <div style={{ fontSize:12, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e" }}>{a.title}</div>
            <div style={{ fontSize:10, color:"#8b8fb8", marginTop:2 }}>{a.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CARD HEADER with expand ──────────────────────────────────────────────────
function CardHeader({ title, sub, legend, onExpand }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
      <div>
        <div style={{ fontSize:13, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e" }}>{title}</div>
        {sub && <div style={{ fontSize:10, color:"#8b8fb8", marginTop:2 }}>{sub}</div>}
        {legend}
      </div>
      <ExpandBtn onClick={onExpand} />
    </div>
  );
}

export default function HomePage() {
  const { filters } = useFilters();
  const { user }    = useAuth();
  const data        = getHomeData(filters);
  const [expanded, setExpanded] = useState(null); // "waterfall" | "health" | "brandmix" | "bridge" | "actions"
  const sub = `${filters.Market} · ${filters.Period} ${filters.Year}`;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#f0f2f8", overflow:"hidden", minWidth:0, minHeight:0 }}>

      {/* Modals */}
      {expanded === "waterfall" && (
        <Modal title="Revenue Waterfall — Brand Performance" subtitle={sub} onClose={() => setExpanded(null)}>
          <ChartBox height={420}>{(w,h) => <RevenueWaterfallChart data={data.waterfall} w={w} h={h} />}</ChartBox>
        </Modal>
      )}
      {expanded === "health" && (
        <Modal title="RGM Health Score" subtitle={sub} onClose={() => setExpanded(null)}>
          <div style={{ maxWidth:600, margin:"0 auto" }}><HealthScores data={data.health} /></div>
          <div style={{ marginTop:20, padding:"10px 12px", background:"#fffbe6", borderLeft:"3px solid #d4a017", borderRadius:"0 8px 8px 0", fontSize:12, color:"#78500a" }}>
            <div style={{ fontFamily:"'MarsBold',system-ui", fontSize:10, textTransform:"uppercase", letterSpacing:".06em", marginBottom:3, color:"#a07000" }}>⚠ Action Required</div>
            SKU Mix score below threshold. Review flagged SKUs this quarter.
          </div>
        </Modal>
      )}
      {expanded === "brandmix" && (
        <Modal title="Brand Revenue Mix" subtitle={sub} onClose={() => setExpanded(null)}>
          <ChartBox height={420}>{(w,h) => <BrandMixChart data={data.brandMix} w={w} h={h} />}</ChartBox>
        </Modal>
      )}
      {expanded === "bridge" && (
        <Modal title="Price vs Volume Bridge" subtitle={`YTD Growth Drivers · ${sub}`} onClose={() => setExpanded(null)}>
          <ChartBox height={420}>{(w,h) => <BridgeWaterfallChart data={data.bridge} w={w} h={h} />}</ChartBox>
        </Modal>
      )}
      {expanded === "actions" && (
        <Modal title="Priority Actions" subtitle={sub} onClose={() => setExpanded(null)}>
          <PriorityActions actions={data.actions} />
        </Modal>
      )}

      {/* Page title */}
      <div style={{ padding:"14px 20px 0", flexShrink:0, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:4, height:20, background:MARS.yellow, borderRadius:2 }} />
        <span style={{ fontFamily:"'MarsExtrabold',system-ui", fontSize:15, color:MARS.blue }}>Home</span>
        <span style={{ fontSize:11, color:"#8b8fb8" }}>· {filters.Market} · {filters.Period} {filters.Year}</span>
        <span style={{ marginLeft:"auto", fontSize:9, fontFamily:"'MarsBold',system-ui", background:`${PURPLE}18`, color:PURPLE, borderRadius:20, padding:"3px 10px", textTransform:"uppercase", letterSpacing:".08em" }}>{user?.role}</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 20px 20px", display:"flex", flexDirection:"column", gap:14 }}>

        {/* KPI row */}
        <div style={{ display:"flex", gap:10 }}>
          {data.kpis.map((k, i) => <KPICard key={i} kpi={k} />)}
        </div>

        {/* Row 1: Waterfall + Health */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
          <Card style={{ padding:"14px 16px" }}>
            <CardHeader
              title="Revenue Waterfall — Brand Performance"
              sub="YTD vs Prior Year · $M"
              onExpand={() => setExpanded("waterfall")}
              legend={
                <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:5 }}>
                  {[["#b0b4c8","Base"],["#00967a","Uplift"],[MARS.red,"Loss"]].map(([c,l]) => (
                    <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, fontFamily:"'MarsBold',system-ui", color:c }}>
                      <span style={{ width:10, height:10, background:c, borderRadius:2, display:"inline-block" }}/> {l}
                    </span>
                  ))}
                </div>
              }
            />
            <ChartBox height={210}>{(w,h) => <RevenueWaterfallChart data={data.waterfall} w={w} h={h} />}</ChartBox>
          </Card>

          <Card style={{ padding:"14px 16px" }}>
            <CardHeader title="RGM Health Score" sub="By Lever · Current Period" onExpand={() => setExpanded("health")} />
            <HealthScores data={data.health} />
            <div style={{ marginTop:14, padding:"10px 12px", background:"#fffbe6", borderLeft:"3px solid #d4a017", borderRadius:"0 8px 8px 0", fontSize:11, color:"#78500a" }}>
              <div style={{ fontFamily:"'MarsBold',system-ui", fontSize:9, textTransform:"uppercase", letterSpacing:".06em", marginBottom:3, color:"#a07000" }}>⚠ Action Required</div>
              SKU Mix score below threshold. Review flagged SKUs this quarter.
            </div>
          </Card>
        </div>

        {/* Row 2: Brand Mix + Bridge + Priority Actions */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          <Card style={{ padding:"14px 16px" }}>
            <CardHeader title="Brand Revenue Mix" onExpand={() => setExpanded("brandmix")} />
            <ChartBox height={190}>{(w,h) => <BrandMixChart data={data.brandMix} w={w} h={h} />}</ChartBox>
          </Card>

          <Card style={{ padding:"14px 16px" }}>
            <CardHeader title="Price vs Volume Bridge" sub="YTD Growth Drivers · $M" onExpand={() => setExpanded("bridge")} />
            <ChartBox height={190}>{(w,h) => <BridgeWaterfallChart data={data.bridge} w={w} h={h} />}</ChartBox>
          </Card>

          <Card style={{ padding:"14px 16px" }}>
            <CardHeader title="Priority Actions" onExpand={() => setExpanded("actions")} />
            <PriorityActions actions={data.actions} />
          </Card>
        </div>

      </div>
    </div>
  );
}