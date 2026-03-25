import { MARS } from "../data/mockData";

const hash = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h);
};
const sr   = (seed) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const vary = (base, seed, range = 0.12) =>
  parseFloat((base * (1 + (sr(seed) - 0.5) * range)).toFixed(2));

// ─── KPI DATA ─────────────────────────────────────────────────────────────────
export const getKPIs = (filters) => {
  const s = hash(`kpi-${filters.Market}-${filters.Category}-${filters.SKU}-${filters.Period}-${filters.Year}`);
  const chg = (seed) => parseFloat(((sr(seed) - 0.4) * 8).toFixed(1));
  return [
    { id: "rev",   label: "Net Revenue",       value: `$${vary(142.5, s+1, 0.18)}M`, change: chg(s+10), color: "#5500bb" },
    { id: "gm",    label: "Gross Margin %",    value: `${vary(41.2, s+2, 0.10)}%`,   change: chg(s+11), color: "#5500bb" },
    { id: "asp",   label: "Avg Selling Price", value: `$${vary(4.99, s+3, 0.08)}`,   change: chg(s+12), color: "#5500bb" },
    { id: "units", label: "Units Sold",         value: `${vary(28.6, s+4, 0.15)}M`,   change: chg(s+13), color: "#5500bb" },
    { id: "promo", label: "Promo Sales %",      value: `${vary(28.0, s+5, 0.14)}%`,   change: chg(s+14), color: "#5500bb" },
    { id: "pr",    label: "Price Realization",  value: `${vary(94.2, s+6, 0.08)}%`,   change: chg(s+15), color: "#5500bb" },
  ];
};

// ─── CATEGORY TABLE ───────────────────────────────────────────────────────────
const CATS = ["Chocolate", "Pet Care", "Gum & Mints", "Rice & Sauces"];
export const getCategoryTable = (filters) => {
  const s = hash(`cat-${filters.Market}-${filters.Year}-${filters.Period}`);
  return CATS.map((cat, i) => ({
    cat,
    rev:    `$${vary(38.5 - i * 4, s + i, 0.20)}M`,
    growth: parseFloat(((sr(s + i + 10) - 0.38) * 14).toFixed(1)),
    units:  `${vary(7.2 - i * 0.8, s + i + 20, 0.18)}M`,
    margin: `${vary(40 - i * 2, s + i + 30, 0.10)}%`,
  }));
};

// ─── TREND CHART ──────────────────────────────────────────────────────────────
export const getTrendData = (filters) => {
  const s = hash(`trend-${filters.Market}-${filters.Year}-${filters.Period}`);
  return Array.from({ length: 13 }, (_, i) => ({
    period: `P${i + 1}`,
    rev:    parseFloat(vary(10.5 + Math.sin(i * 0.5) * 1.5, s + i,       0.12).toFixed(2)),
    price:  parseFloat(vary(4.85 + i * 0.01,                s + i + 50,  0.04).toFixed(2)),
    vol:    parseFloat(vary(2.1  - i * 0.02,                s + i + 100, 0.10).toFixed(2)),
  }));
};

// ─── WATERFALL DATA — proper floating bars ─────────────────────────────────────
// A waterfall chart needs: for each bar, a transparent "spacer" from 0 to bar start,
// then the actual bar on top. Positive bars go up, negative go down.
export const getWaterfallData = (filters) => {
  const s = hash(`wf-${filters.Market}-${filters.Year}-${filters.Period}`);

  // Driver values — some positive, some negative for realism
  const base      = parseFloat(vary(118, s,     0.08).toFixed(1));
  const priceEff  = parseFloat(vary(+9,  s + 1, 0.35).toFixed(1));   // positive: price up
  const volEff    = parseFloat(vary(-6,  s + 2, 0.30).toFixed(1));   // negative: volume down
  const mixEff    = parseFloat(vary(+4,  s + 3, 0.40).toFixed(1));   // positive: mix improvement
  const promoEff  = parseFloat(vary(-7,  s + 4, 0.30).toFixed(1));   // negative: promo cost
  const newLaunch = parseFloat(vary(+5,  s + 5, 0.50).toFixed(1));   // positive: new SKU
  const other     = parseFloat(vary(-2,  s + 6, 0.60).toFixed(1));   // small negative
  const total     = parseFloat((base + priceEff + volEff + mixEff + promoEff + newLaunch + other).toFixed(1));

  // Build cumulative running total to compute bar starts
  const drivers = [
    { name: "Base",        value: base,      isTotal: true,  isBase: true  },
    { name: "Price",       value: priceEff,  isTotal: false, isBase: false },
    { name: "Volume",      value: volEff,    isTotal: false, isBase: false },
    { name: "Mix",         value: mixEff,    isTotal: false, isBase: false },
    { name: "Promo",       value: promoEff,  isTotal: false, isBase: false },
    { name: "New Launch",  value: newLaunch, isTotal: false, isBase: false },
    { name: "Other",       value: other,     isTotal: false, isBase: false },
    { name: "Net Revenue", value: total,     isTotal: true,  isBase: false },
  ];

  let running = 0;
  return drivers.map(d => {
    let spacer, bar, color;

    if (d.isBase) {
      spacer  = 0;
      bar     = d.value;
      color   = MARS.blue;
      running = d.value;
    } else if (d.isTotal) {
      spacer  = 0;
      bar     = d.value;
      color   = d.value >= base ? "#00967a" : MARS.red;
    } else {
      if (d.value >= 0) {
        spacer = running;
        bar    = d.value;
        color  = "#00967a";
      } else {
        spacer = running + d.value; // bar starts at bottom of negative
        bar    = Math.abs(d.value);
        color  = MARS.red;
      }
      running += d.value;
    }

    return { name: d.name, spacer, bar, color, value: d.value, isTotal: d.isTotal };
  });
};