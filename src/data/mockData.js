// ─── MARS COLORS ──────────────────────────────────────────────────────────────
export const MARS = {
  blue:"#0000a0", blueTint:"#8080cf", yellow:"#ffdc00", yellowTint:"#ffed80",
  green:"#00d7b9", greenTint:"#80ebdc", skyBlue:"#00dcfa", freshGreen:"#a6db00",
  purple:"#9600ff", pink:"#ff32a0", red:"#ff3c14", orange:"#ff8200",
  darkGray:"#3c3c3c", white:"#ffffff",
};

// ─── PERSONAS ─────────────────────────────────────────────────────────────────
export const PERSONAS = ["Executive", "Finance"];

// ─── PERIOD FILTER — P1 to P13 only, no dates ─────────────────────────────────
export const PERIODS = Array.from({length:13},(_,i)=>`P${i+1}`);

// ─── REGION → MARKET ──────────────────────────────────────────────────────────
export const REGION_MARKET_MAP = {
  "North America":        ["USA","Canada","Mexico"],
  "Europe":               ["UK","Germany","France","Spain"],
  "Asia Pacific":         ["China","Japan","Australia","India"],
  "Latin America":        ["Brazil","Argentina","Colombia"],
  "Middle East & Africa": ["UAE","Saudi Arabia","South Africa"],
};
export const REGIONS   = Object.keys(REGION_MARKET_MAP);
export const YEARS     = [2025,2026,2027];
export const RETAILERS = ["All Retailers","Retailer X","Retailer Y","Retailer Z"];

// ─── CATEGORY → SUB-CATEGORY → SKU ───────────────────────────────────────────
export const CATEGORY_TREE = {
  "Chocolate": {
    "Bars":      ["Snickers 50g","Twix 50g","Milky Way 26g","Galaxy 42g"],
    "Multipacks":["Snickers Multipack 4x50g","M&Ms Peanut 200g","M&Ms Chocolate 200g"],
    "Sharing":   ["Celebrations 196g","Quality Street 220g"],
  },
  "Pet Care": {
    "Dog Food":  ["Pedigree Adult 400g","Pedigree Puppy 400g"],
    "Cat Food":  ["Whiskas Adult 400g","Whiskas Kitten 400g"],
    "Premium":   ["Royal Canin Adult 2kg","Royal Canin Kitten 2kg"],
  },
  "Gum & Mints": {
    "Gum":       ["Extra Peppermint 10pc","Extra Spearmint 10pc"],
    "Confectionery":["Skittles Original 45g","Starburst Original 45g"],
  },
  "Rice & Sauces": {
    "Rice":      ["Uncle Ben's Basmati 500g","Uncle Ben's Express 250g"],
    "Sauces":    ["Dolmio Bolognese 500g","Dolmio Stir-In 150g"],
  },
};
export const CATEGORIES    = Object.keys(CATEGORY_TREE);
export const getSubCats    = (cat) => cat ? Object.keys(CATEGORY_TREE[cat]||{}) : [];
export const getSKUs       = (cat,sub) => (cat&&sub) ? (CATEGORY_TREE[cat]?.[sub]||[]) : [];

// ─── FILTER DEFAULTS ─────────────────────────────────────────────────────────
export const FILTER_DEFAULTS = {
  Year:2026, Region:"Europe", Market:"UK",
  Retailer:"All Retailers", Period:"P3",
  Category:"Chocolate", SubCategory:"Bars", SKU:"Snickers 50g",
};

// ─── RANDOM HELPERS ───────────────────────────────────────────────────────────
const hash = str=>{let h=5381;for(let i=0;i<str.length;i++)h=(h*33)^str.charCodeAt(i);return Math.abs(h);};
const sr   = seed=>{const x=Math.sin(seed+1)*10000;return x-Math.floor(x);};
const vary = (base,seed,range=0.15)=>parseFloat((base*(1+(sr(seed)-0.5)*range)).toFixed(3));

// ─── ELASTICITY DATA ──────────────────────────────────────────────────────────
export const getElasticityData = filters=>{
  const s=hash(`${filters.Market}-${filters.SKU}-${filters.Period}-${filters.Year}`);
  const bv=vary(7.3,s,0.20),s1=vary(0.62,s+1,0.25),s2=vary(1.15,s+2,0.25),s3=vary(0.50,s+3,0.25);
  return Array.from({length:29},(_,i)=>{
    const price=parseFloat((3.0+i*0.25).toFixed(2));
    let vol;
    if(price<=5.0)      vol=bv-(price-3.0)*s1;
    else if(price<=6.5) vol=(bv-2.0*s1)-(price-5.0)*s2;
    else                vol=(bv-2.0*s1-1.5*s2)-(price-6.5)*s3;
    return {price,vol:parseFloat(Math.max(1.5,vol).toFixed(3))};
  });
};

// ─── ELASTICITY METRICS — slider drives delta vol + rev, NO profit ────────────
export const getElasticityMetrics = (filters,pricePct)=>{
  const s        = hash(`metrics-${filters.Market}-${filters.SKU}-${filters.Period}`);
  const elast    = -(0.8+sr(s)*1.4);
  const baseRevK = Math.round(180+sr(s+1)*300);
  const dVolPct  = parseFloat((elast*pricePct).toFixed(1));
  const dRevPct  = parseFloat((pricePct+dVolPct).toFixed(1));
  const dRevK    = Math.round((dRevPct/100)*baseRevK);
  return {
    vol:`${dVolPct>=0?"+":""}${dVolPct}%`,
    rev:`${dRevPct>=0?"+":""}${dRevPct}% (${dRevK>=0?"+":""}$${Math.abs(dRevK)}k)`,
    volUp:dVolPct>=0, revUp:dRevPct>=0,
    simPrice:parseFloat((4.99*(1+pricePct/100)).toFixed(2)),
  };
};

export const getHighlightsData = filters=>{
  const s=hash(`hl-${filters.Market}-${filters.SKU}-${filters.Period}-${filters.Year}`);
  return {pct:parseFloat((1.0+sr(s+1)*2.5).toFixed(1)),currentPrice:4.99};
};

// ─── PPA DATA — pack size x-axis, price per unit y-axis ─────────────────────
export const getPPAData = filters=>{
  const s=hash(`ppa-${filters.Market}-${filters.SKU}-${filters.Retailer}-${filters.Period}`);
  const base=[
    {sku:"Our 26g",    packSize:"26g",  ourBrand:true, baseShelf:1.49,basePpu:0.057,vol:80},
    {sku:"Our 50g",    packSize:"50g",  ourBrand:true, baseShelf:2.49,basePpu:0.050,vol:90},
    {sku:"Our 100g",   packSize:"100g", ourBrand:true, baseShelf:3.99,basePpu:0.040,vol:70},
    {sku:"Our 200g",   packSize:"200g", ourBrand:true, baseShelf:6.49,basePpu:0.032,vol:55},
    {sku:"Comp 50g",   packSize:"50g",  ourBrand:false,baseShelf:2.69,basePpu:0.054,vol:65},
    {sku:"Comp 100g",  packSize:"100g", ourBrand:false,baseShelf:4.29,basePpu:0.043,vol:60},
    {sku:"Comp 200g",  packSize:"200g", ourBrand:false,baseShelf:6.99,basePpu:0.035,vol:45},
  ];
  return base.map((item,i)=>({
    ...item,
    shelf: parseFloat(vary(item.baseShelf,s+i,0.08).toFixed(2)),
    ppu:   parseFloat(vary(item.basePpu,s+i+50,0.08).toFixed(4)),
    ppa:   parseFloat(vary(item.basePpu,s+i+50,0.08).toFixed(4)),
  }));
};

// ─── BUBBLE DATA — price vs market share vs revenue ───────────────────────────
export const getBubbleData = filters=>{
  const s=hash(`bubble-${filters.Market}-${filters.SKU}-${filters.Retailer}-${filters.Period}`);
  const base=[
    {name:filters.SKU||"Our Brand", ours:true,  basePrice:4.99,baseShare:28,baseRev:42},
    {name:"Comp A",                 ours:false, basePrice:5.29,baseShare:22,baseRev:34},
    {name:"Comp B",                 ours:false, basePrice:4.49,baseShare:18,baseRev:28},
    {name:"Comp C (Value)",         ours:false, basePrice:3.79,baseShare:14,baseRev:20},
    {name:"Comp D (Premium)",       ours:false, basePrice:6.49,baseShare:8, baseRev:15},
    {name:"Comp E",                 ours:false, basePrice:5.99,baseShare:10,baseRev:18},
  ];
  return base.map((item,i)=>({
    ...item,
    price:   parseFloat(vary(item.basePrice,s+i,0.08).toFixed(2)),
    share:   parseFloat(vary(item.baseShare,s+i+10,0.12).toFixed(1)),
    revenue: parseFloat(vary(item.baseRev,s+i+20,0.15).toFixed(1)),
  }));
};

// ─── LADDER DATA ──────────────────────────────────────────────────────────────
export const getLadderData = filters=>{
  const s=hash(`ladder-${filters.Market}-${filters.SKU}-${filters.Retailer}-${filters.Period}`);
  const base=[
    {name:"Comp D (Premium)",  baseIndex:112,share:7, ours:false},
    {name:"Comp A",            baseIndex:106,share:22,ours:false},
    {name:filters.SKU||"Our",  baseIndex:100,share:28,ours:true},
    {name:"Comp B",            baseIndex:96, share:18,ours:false},
    {name:"Comp C (Multipack)",baseIndex:88, share:10,ours:false},
  ];
  return base.map((item,i)=>({...item,index:Math.round(vary(item.baseIndex,s+i,0.06))}));
};

// ─── STATUS BY MARKET ─────────────────────────────────────────────────────────
export const STATUS_BY_MARKET = {
  UK:             {sov:"green", brandHealth:{status:"yellow",label:"Watch"},   tradeRate:{status:"red",   label:"Warning"}},
  Germany:        {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"yellow",label:"Watch"}},
  France:         {sov:"yellow",brandHealth:{status:"red",   label:"At Risk"}, tradeRate:{status:"red",   label:"Warning"}},
  Spain:          {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"green", label:"On Track"}},
  USA:            {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"yellow",label:"Watch"}},
  Canada:         {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"green", label:"On Track"}},
  Mexico:         {sov:"yellow",brandHealth:{status:"yellow",label:"Watch"},   tradeRate:{status:"yellow",label:"Watch"}},
  China:          {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"green", label:"On Track"}},
  Japan:          {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"yellow",label:"Watch"}},
  Australia:      {sov:"yellow",brandHealth:{status:"yellow",label:"Watch"},   tradeRate:{status:"green", label:"On Track"}},
  India:          {sov:"green", brandHealth:{status:"red",   label:"At Risk"}, tradeRate:{status:"red",   label:"Warning"}},
  Brazil:         {sov:"yellow",brandHealth:{status:"yellow",label:"Watch"},   tradeRate:{status:"red",   label:"Warning"}},
  Argentina:      {sov:"red",   brandHealth:{status:"red",   label:"At Risk"}, tradeRate:{status:"red",   label:"Warning"}},
  Colombia:       {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"green", label:"On Track"}},
  UAE:            {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"green", label:"On Track"}},
  "Saudi Arabia": {sov:"green", brandHealth:{status:"green", label:"Healthy"}, tradeRate:{status:"yellow",label:"Watch"}},
  "South Africa": {sov:"yellow",brandHealth:{status:"yellow",label:"Watch"},   tradeRate:{status:"red",   label:"Warning"}},
};

// ─── NOTIFICATIONS BY PERSONA ─────────────────────────────────────────────────
export const NOTIFICATIONS_BY_PERSONA = {
  "Executive": [
    {id:1,title:"Revenue Target Alert",      body:"UK Net Revenue tracking 4% below Q2 target.",                time:"5m ago", type:"warning",read:false},
    {id:2,title:"Market Share Update",       body:"Chocolate category share up 1.2pp in Germany.",             time:"1h ago", type:"success",read:false},
    {id:3,title:"Pricing Opportunity",       body:"Snickers 50g price gap vs Comp A widened to 8%.",           time:"2h ago", type:"info",   read:false},
    {id:4,title:"Board Report Due",          body:"Q2 Executive Summary due Friday — 3 sections pending.",     time:"1d ago", type:"alert",  read:true},
    {id:5,title:"Portfolio Review",          body:"Annual portfolio strategy review scheduled next Monday.",    time:"2d ago", type:"info",   read:true},
  ],
  "Finance": [
    {id:1,title:"Trade Rate Cap Warning",    body:"UK trade rate at 17.8% — approaching 18% cap.",             time:"2m ago", type:"warning",read:false},
    {id:2,title:"P&L Impact Alert",          body:"Scenario v3 shows +$2.3M margin vs baseline.",              time:"45m ago",type:"info",   read:false},
    {id:3,title:"Approval Required",         body:"SRP +2% on Snickers 50g awaiting Finance sign-off.",        time:"2h ago", type:"alert",  read:false},
    {id:4,title:"Budget Variance",           body:"Q1 promo spend 6% above plan in Germany.",                  time:"1d ago", type:"warning",read:true},
    {id:5,title:"Model Refresh Complete",    body:"Elasticity models updated with P2 2026 scan data.",         time:"2d ago", type:"success",read:true},
  ],
};

// ─── PERSONA CONFIG ──────────────────────────────────────────────────────────
export const PERSONA_CONFIG = {
  Executive: {
    pages:       ["Home","Pricing Strategy","Promotions"],
    livePages:   ["Home","Pricing Strategy","Promotions"],
    kpis: [
      { id:"rev",    label:"Net Revenue",       value:(s,vary)=>`$${vary(142.5,s+1,0.18)}M`, color:"#5500bb" },
      { id:"share",  label:"Market Share",      value:(s,vary)=>`${vary(28.4,s+2,0.12)}%`,  color:"#5500bb" },
      { id:"growth", label:"Revenue Growth",    value:(s,vary)=>`+${vary(4.2,s+3,0.20)}%`,  color:"#5500bb" },
      { id:"vol",    label:"Units Sold",        value:(s,vary)=>`${vary(28.6,s+4,0.15)}M`,  color:"#5500bb" },
      { id:"brand",  label:"Brand Health Score",value:(s,vary)=>`${vary(72,s+5,0.08)}/100`, color:"#5500bb" },
      { id:"nps",    label:"NPS Score",         value:(s,vary)=>`${Math.round(vary(54,s+6,0.12))}`,color:"#5500bb" },
    ],
    homeGreeting: "Strategic Overview",
    homeSubtitle: "Executive Dashboard · Full Portfolio View",
  },
  Finance: {
    pages:       ["Home","Pricing Strategy","Promotions"],
    livePages:   ["Home","Pricing Strategy","Promotions"],
    kpis: [
      { id:"rev",    label:"Net Revenue",       value:(s,vary)=>`$${vary(142.5,s+1,0.18)}M`, color:"#5500bb" },
      { id:"gm",     label:"Gross Margin %",    value:(s,vary)=>`${vary(41.2,s+2,0.10)}%`,   color:"#5500bb" },
      { id:"asp",    label:"Avg Selling Price", value:(s,vary)=>`$${vary(4.99,s+3,0.08)}`,   color:"#5500bb" },
      { id:"pr",     label:"Price Realization", value:(s,vary)=>`${vary(94.2,s+6,0.08)}%`,   color:"#5500bb" },
      { id:"roi",    label:"Promo ROI",         value:(s,vary)=>`${vary(1.18,s+7,0.12)}x`,   color:"#5500bb" },
      { id:"mac",    label:"Total MAC (€)",     value:(s,vary)=>`€${vary(8.4,s+8,0.14)}M`,   color:"#5500bb" },
    ],
    homeGreeting: "Finance Overview",
    homeSubtitle: "Finance Dashboard · P&L & Pricing Focus",
  },
};

export const getPersonaKPIs = (role, filters) => {
  const hash = str=>{let h=5381;for(let i=0;i<str.length;i++)h=(h*33)^str.charCodeAt(i);return Math.abs(h);};
  const sr   = seed=>{const x=Math.sin(seed+1)*10000;return x-Math.floor(x);};
  const vary = (base,seed,range=0.12)=>parseFloat((base*(1+(sr(seed)-0.5)*range)).toFixed(2));
  const chg  = seed=>parseFloat(((sr(seed)-0.4)*8).toFixed(1));
  const s    = hash(`kpi-${filters.Market}-${filters.Category}-${filters.Period}-${filters.Year}-${role}`);
  const cfg  = PERSONA_CONFIG[role] || PERSONA_CONFIG["Finance"];
  return cfg.kpis.map((k,i) => ({
    ...k,
    value:  k.value(s+i*10, vary),
    change: chg(s+i*10+100),
  }));
};