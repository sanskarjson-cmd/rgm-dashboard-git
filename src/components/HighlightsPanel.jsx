import { useState, useEffect } from "react";
import { useFilters } from "../context/FilterContext";
import { getHighlightsData, getElasticityMetrics, getPPAData, getLadderData, MARS } from "../data/mockData";

// ─── SCENARIO CART CONTEXT (module-level so it persists across tab switches) ──
let _cartItems = [];
let _cartListeners = [];
const cartStore = {
  get: () => _cartItems,
  add: (item) => { _cartItems = [..._cartItems, item]; _cartListeners.forEach(fn => fn([..._cartItems])); },
  remove: (i) => { _cartItems = _cartItems.filter((_,idx) => idx !== i); _cartListeners.forEach(fn => fn([..._cartItems])); },
  clear: () => { _cartItems = []; _cartListeners.forEach(fn => fn([])); },
  subscribe: (fn) => { _cartListeners.push(fn); return () => { _cartListeners = _cartListeners.filter(f => f !== fn); }; },
};

function useCart() {
  const [items, setItems] = useState(cartStore.get());
  useEffect(() => cartStore.subscribe(setItems), []);
  return { items, add: cartStore.add, remove: cartStore.remove, clear: cartStore.clear };
}

// ─── SCENARIO CART MODAL ──────────────────────────────────────────────────────
function ScenarioCartModal({ onClose }) {
  const { items, remove, clear } = useCart();

  const download = () => {
    if (!items.length) return;
    const headers = ["Scenario","SKU","Market","Period","SRP Change %","Sim Price","Δ Volume","Δ Revenue"];
    const rows = items.map(r => [r.name, r.sku, r.market, r.period, `${r.srp>=0?"+":""}${r.srp}%`, `$${r.simPrice}`, r.vol, r.rev]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = "scenario_comparison.csv";
    a.click();
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,30,.6)", backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:201, width:"min(90vw,860px)", background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,160,.2)", animation:"modalIn .25s cubic-bezier(.34,1.4,.64,1)" }}>
        <div style={{ background:`linear-gradient(135deg,${MARS.blue},#0000c8)`, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`3px solid ${MARS.yellow}` }}>
          <div>
            <div style={{ fontSize:14, fontFamily:"'MarsBold',system-ui", color:"#fff" }}>Scenario Cart</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:1 }}>{items.length} scenario{items.length!==1?"s":""} saved</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {items.length > 0 && (
              <>
                <button onClick={download} style={{ padding:"6px 14px", borderRadius:7, border:"none", background:MARS.yellow, fontSize:11, fontFamily:"'MarsBold',system-ui", color:MARS.blue, cursor:"pointer" }}>↓ Download CSV</button>
                <button onClick={clear}    style={{ padding:"6px 14px", borderRadius:7, border:"1px solid rgba(255,255,255,.3)", background:"transparent", fontSize:11, fontFamily:"'MarsBold',system-ui", color:"#fff", cursor:"pointer" }}>Clear All</button>
              </>
            )}
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:7, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.1)", cursor:"pointer", color:"#fff", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        </div>
        <div style={{ padding:"16px 20px", overflowY:"auto", maxHeight:"60vh" }}>
          {items.length === 0
            ? <div style={{ textAlign:"center", padding:"40px 0", color:"#8b8fb8", fontSize:13 }}>No scenarios in cart yet.<br/>Use the SRP Modeller and click <strong>Add to Cart</strong>.</div>
            : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #e8e8f4" }}>
                    {["Scenario","SKU","Market","Period","SRP Δ","Sim Price","Δ Volume","Δ Revenue",""].map(h => (
                      <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".08em", whiteSpace:"nowrap", background:"#f8f8fc" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((r,i) => (
                    <tr key={i} style={{ borderBottom:"1px solid #f0f0f8", background:i%2===0?"#fff":"#f9f9fc" }}>
                      <td style={{ padding:"9px 10px", fontSize:11, fontFamily:"'MarsBold',system-ui", color:MARS.blue }}>{r.name}</td>
                      <td style={{ padding:"9px 10px", fontSize:11, color:"#1a1a2e" }}>{r.sku}</td>
                      <td style={{ padding:"9px 10px", fontSize:11, color:"#1a1a2e" }}>{r.market}</td>
                      <td style={{ padding:"9px 10px", fontSize:11, color:"#1a1a2e" }}>{r.period}</td>
                      <td style={{ padding:"9px 10px", fontSize:11, fontFamily:"'MarsBold',system-ui", color:r.srp>=0?"#00967a":MARS.red }}>{r.srp>=0?"+":""}{r.srp}%</td>
                      <td style={{ padding:"9px 10px", fontSize:11, color:"#1a1a2e" }}>${r.simPrice}</td>
                      <td style={{ padding:"9px 10px", fontSize:11, fontFamily:"'MarsBold',system-ui", color:r.volUp?"#00967a":MARS.red }}>{r.vol}</td>
                      <td style={{ padding:"9px 10px", fontSize:11, fontFamily:"'MarsBold',system-ui", color:r.revUp?"#00967a":MARS.red }}>{r.rev}</td>
                      <td style={{ padding:"9px 10px" }}>
                        <button onClick={() => remove(i)} style={{ background:"#fff1f0", border:"1px solid #ffd0cc", borderRadius:6, padding:"2px 8px", fontSize:10, color:MARS.red, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </>
  );
}

// ─── ELASTICITY HIGHLIGHTS ────────────────────────────────────────────────────
function ElasticityHighlights({ theme, filters }) {
  const base = getHighlightsData(filters);
  const [slider, setSlider]         = useState(base.pct);
  const [guardrails, setGuardrails] = useState(true);
  const [cartOpen, setCartOpen]     = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);
  const { items, add }              = useCart();

  useEffect(() => {
    const d = getHighlightsData(filters);
    setSlider(d.pct);
  }, [filters.Market, filters.SKU, filters.Period, filters.Year, filters.Category]);

  const m = getElasticityMetrics(filters, slider);

  const handleAddToCart = () => {
    const scenarioNum = items.length + 1;
    add({
      name:     `Scenario ${scenarioNum}`,
      sku:      filters.SKU || "—",
      market:   filters.Market,
      period:   filters.Period,
      srp:      parseFloat(slider.toFixed(1)),
      simPrice: m.simPrice,
      vol:      m.vol,
      rev:      m.rev,
      volUp:    m.volUp,
      revUp:    m.revUp,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1500);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
      {cartOpen && <ScenarioCartModal onClose={() => setCartOpen(false)} />}

      {/* Cart badge button */}
      <button onClick={() => setCartOpen(true)}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:8, border:`1.5px solid ${MARS.blue}25`, background:`${MARS.blue}06`, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
        onMouseOver={e => e.currentTarget.style.background = `${MARS.blue}12`}
        onMouseOut={e => e.currentTarget.style.background = `${MARS.blue}06`}>
        <span style={{ fontSize:10, fontFamily:"'MarsBold',system-ui", color:MARS.blue }}>Scenario Cart</span>
        <span style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", background:items.length>0?MARS.blue:"#e0e0f0", color:items.length>0?"#fff":"#8b8fb8", borderRadius:20, padding:"1px 7px" }}>{items.length}</span>
      </button>

      {/* SRP Modeller */}
      <div style={{ background:`linear-gradient(135deg,${theme.accent}12,${theme.accent}06)`, borderRadius:10, padding:"12px 10px 10px", border:`1.5px solid ${guardrails ? theme.accent+"25" : MARS.red+"40"}`, transition:"border-color .3s" }}>
        <div style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>SRP Modeller & Impact</div>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:8 }}>
          <span style={{ fontSize:30, fontFamily:"'MarsExtrabold',system-ui", color: guardrails && (slider < -3 || slider > 7) ? MARS.red : theme.accent, lineHeight:1, transition:"color .2s" }}>
            {slider>=0?"+":""}{slider.toFixed(1)}%
          </span>
          <span style={{ fontSize:12, color:"#8b8fb8", fontFamily:"'MarsBold',system-ui" }}>${m.simPrice}</span>
        </div>
        <input type="range"
          min={-5} max={10} step={0.1} value={slider}
          onChange={e => {
            const val = parseFloat(e.target.value);
            if (guardrails) {
              // Clamp to guardrail limits when enabled
              setSlider(Math.min(7.0, Math.max(-3.0, val)));
            } else {
              setSlider(val);
            }
          }}
          style={{ width:"100%", accentColor: guardrails ? theme.accent : MARS.red, marginTop:10 }}/>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#bbb", marginTop:2 }}>
          <span>-5%</span>
          {guardrails && <span style={{ fontSize:8, color:MARS.red, fontFamily:"'MarsBold',system-ui" }}>│ -3% min</span>}
          <span>0</span>
          {guardrails && <span style={{ fontSize:8, color:MARS.red, fontFamily:"'MarsBold',system-ui" }}>+7% max │</span>}
          <span>+10%</span>
        </div>
        {/* Guardrail violation warning */}
        {!guardrails && (slider < -3 || slider > 7) && (
          <div style={{ marginTop:6, fontSize:9, color:MARS.red, fontFamily:"'MarsBold',system-ui", background:"#fff1f0", borderRadius:5, padding:"3px 7px", textAlign:"center" }}>
            ⚠ Outside guardrail limits ({slider < -3 ? "below -3%" : "above +7%"})
          </div>
        )}
      </div>

      {/* Delta metrics — NO profit row */}
      <div style={{ background:"#f8f8fc", borderRadius:8, padding:"4px 10px" }}>
        {[
          { label:"Δ Volume",  value:m.vol, up:m.volUp },
          { label:"Δ Revenue", value:m.rev, up:m.revUp },
        ].map(row => (
          <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f0f0f8" }}>
            <span style={{ fontSize:11, color:"#8b8fb8" }}>{row.label}</span>
            <span style={{ display:"inline-block", fontSize:10, fontFamily:"'MarsBold',system-ui", color:row.up?"#00967a":MARS.red, background:row.up?"#e0f7f2":"#fff1f0", borderRadius:20, padding:"1px 8px" }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Guardrails */}
      <div style={{ background:guardrails?"#f0fdf8":"#fff1f0", borderRadius:8, padding:"8px 10px", border:`1px solid ${guardrails?"#b0eed8":"#ffd0cc"}`, transition:"all .3s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, fontFamily:"'MarsBold',system-ui", color:"#1a1a2e" }}>Respect Guardrails</div>
            <div style={{ fontSize:10, color:guardrails?"#00967a":MARS.red, marginTop:2 }}>
              {guardrails ? "✓ Capped: -3% to +7%" : "⚠ Full range unlocked"}
            </div>
          </div>
          <button onClick={() => {
            const next = !guardrails;
            setGuardrails(next);
            // Snap slider into guardrail range when re-enabling
            if (next) setSlider(s => Math.min(7.0, Math.max(-3.0, s)));
          }} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <div style={{ width:38, height:21, borderRadius:11, background:guardrails?"#00967a":"#ddd", position:"relative", transition:"background .3s", boxShadow:"inset 0 1px 3px rgba(0,0,0,.15)" }}>
              <div style={{ position:"absolute", top:2.5, left:guardrails?18:2.5, width:16, height:16, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.25)", transition:"left .25s" }}/>
            </div>
          </button>
        </div>
      </div>

      {/* Competitor zone note */}
      <div style={{ background:"#fffbe6", borderRadius:8, padding:"7px 10px", border:`1px solid ${MARS.yellow}80` }}>
        <div style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#78500a", marginBottom:2 }}>Competitor Pricing Zone</div>
        <div style={{ fontSize:10, color:"#78500a", lineHeight:1.5 }}>Yellow band on chart shows current competitor price range. Keep SRP within this band to maintain index parity.</div>
      </div>

      {/* Add to Cart CTA */}
      <button onClick={handleAddToCart}
        style={{ width:"100%", padding:"10px 0", borderRadius:9, background:addedFlash?"#00967a":`linear-gradient(135deg,${theme.accent},${theme.accent}cc)`, color:"#fff", fontFamily:"'MarsBold',system-ui", fontSize:12, border:"none", cursor:"pointer", letterSpacing:".04em", marginTop:"auto", boxShadow:`0 4px 14px ${theme.accent}35`, transition:"all .3s" }}>
        {addedFlash ? "✓ Added to Cart!" : "+ Add to Scenario Cart"}
      </button>
    </div>
  );
}

function PPAHighlights({ theme, filters }) {
  const data = getPPAData(filters).slice(0,4);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
      <div style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".1em" }}>PPA by SKU — {filters.SubCategory || filters.Category}</div>
      {data.map(d => (
        <div key={d.sku} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:8, background:d.ourBrand?`${theme.accent}0e`:"#f8f8fc", borderLeft:`3px solid ${d.ourBrand?theme.accent:"#e0e0f0"}` }}>
          <div>
            <div style={{ fontSize:11, fontFamily:d.ourBrand?"'MarsBold',system-ui":"inherit", color:"#1a1a2e" }}>{d.sku}</div>
            <div style={{ fontSize:10, color:"#8b8fb8", marginTop:1 }}>{d.packSize} · ${d.shelf}</div>
          </div>
          <span style={{ fontSize:13, fontFamily:"'MarsExtrabold',system-ui", color:d.ourBrand?theme.accent:"#8b8fb8" }}>${d.ppa}</span>
        </div>
      ))}
      <div style={{ background:`${MARS.blue}08`, borderRadius:8, padding:"8px 10px", marginTop:"auto", border:"1px solid #dde0ef" }}>
        <div style={{ fontSize:11, color:MARS.blue, lineHeight:1.5 }}>💡 {filters.Market} · {filters.Period} — align PPA across pack sizes.</div>
      </div>
    </div>
  );
}

function LadderHighlights({ theme, filters }) {
  const data = getLadderData(filters);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
      <div style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:"#8b8fb8", textTransform:"uppercase", letterSpacing:".1em" }}>Market Position — {filters.Retailer}</div>
      {[...data].reverse().map(d => (
        <div key={d.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:8, background:d.ours?`${theme.accent}0e`:"#f8f8fc", borderLeft:`3px solid ${d.ours?theme.accent:"#e0e0f0"}` }}>
          <div>
            <div style={{ fontSize:11, fontFamily:d.ours?"'MarsBold',system-ui":"inherit", color:d.ours?theme.accent:"#1a1a2e" }}>{d.ours?"★ ":""}{d.name}</div>
            <div style={{ fontSize:10, color:"#8b8fb8", marginTop:1 }}>{d.share}% share</div>
          </div>
          <span style={{ fontSize:13, fontFamily:"'MarsExtrabold',system-ui", color:d.ours?theme.accent:"#c0c0d8" }}>{d.index}</span>
        </div>
      ))}
    </div>
  );
}

export default function HighlightsPanel({ tab, theme }) {
  const { filters } = useFilters();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{ width:collapsed?38:252, transition:"width .3s", flexShrink:0, background:"#fff", borderLeft:"1px solid #e8e8f4", display:"flex", flexDirection:"column", overflow:"visible", position:"relative", zIndex:20, boxShadow:"-2px 0 12px rgba(0,0,160,.04)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:collapsed?"center":"space-between", padding:"10px 10px 8px", flexShrink:0, borderBottom:"1px solid #f0f0f8", background:`linear-gradient(to right,${theme.accentLight||"#e8e8f8"}40,#fff)` }}>
        {!collapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:9, fontFamily:"'MarsBold',system-ui", color:MARS.blue, textTransform:"uppercase", letterSpacing:".12em" }}>Highlights</span>
            <span style={{ fontSize:8, fontFamily:"'MarsBold',system-ui", background:`${theme.accent}18`, color:theme.accent, borderRadius:20, padding:"2px 8px", textTransform:"uppercase", letterSpacing:".06em" }}>{tab}</span>
          </div>
        )}
        <button onClick={() => setCollapsed(v=>!v)}
          style={{ width:22, height:22, borderRadius:6, background:`${theme.accent}12`, border:`1px solid ${theme.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <svg style={{ width:10, height:10, color:theme.accent, transform:collapsed?"rotate(180deg)":"none", transition:"transform .3s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {collapsed && (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ writingMode:"vertical-rl", fontSize:8, fontFamily:"'MarsBold',system-ui", color:"#8080cf", letterSpacing:".15em", textTransform:"uppercase" }}>Highlights</span>
        </div>
      )}

      {!collapsed && (
        <div style={{ flex:1, padding:"10px 12px 12px", display:"flex", flexDirection:"column", overflow:"hidden", gap:8 }}>
          {tab==="Elasticity"          && <ElasticityHighlights theme={theme} filters={filters}/>}
          {tab==="PPA"                 && <PPAHighlights         theme={theme} filters={filters}/>}
          {tab==="Competitive Ladder"  && <LadderHighlights      theme={theme} filters={filters}/>}
        </div>
      )}
    </aside>
  );
}