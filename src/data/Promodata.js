import { MARS } from "./mockData";

export const PROMO_OPTIONS = {
  countries:   ["UK", "Germany", "France", "Spain", "USA", "Australia"],
  customers:   ["Retailer X", "Retailer Y", "Retailer Z", "All"],
  mechanisms:  ["BOGOF", "% Off", "Multibuy", "Price Cut", "Free Case", "TPR"],
  brands:      ["Snickers", "M&Ms", "Twix", "Pedigree", "Whiskas", "Extra"],
  skus:        ["Snickers 50g", "Snickers Multipack", "M&Ms 200g", "Twix 50g", "Pedigree 400g", "Extra 10pc"],
  brandTechs:  ["Standard", "Premium", "Value", "Impulse"],
  categories:  ["Chocolate", "Pet Care", "Gum & Mints", "Rice & Sauces"],
  zreps:       ["ZR001", "ZR002", "ZR003", "ZR004", "ZR005"],
  years:       ["2024", "2025", "2026"],
};

// Seeded random
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return Math.abs(h); };
const sr   = seed => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const rnd  = (min, max, seed) => parseFloat((min + sr(seed) * (max - min)).toFixed(2));

// ─── SIMULATE OUTPUT ──────────────────────────────────────────────────────────
export const simulate = (params) => {
  const s = hash(`${params.sku}-${params.mechanism}-${params.country}-${params.startDate}`);
  const baseVol     = Math.round(rnd(800, 4000, s));
  const baseRev     = parseFloat((baseVol * rnd(4.5, 9.5, s + 1)).toFixed(0));
  const upliftPct   = parseFloat(rnd(8, 45, s + 2).toFixed(1));
  const projVol     = Math.round(baseVol * (1 + upliftPct / 100));
  const projRev     = parseFloat((projVol * rnd(4.0, 9.0, s + 3)).toFixed(0));
  const roi         = parseFloat(rnd(0.7, 1.8, s + 4).toFixed(2));
  const catRoi      = parseFloat(rnd(0.9, 1.3, s + 5).toFixed(2));
  const mac         = parseFloat((parseFloat(params.budget || 5000) * rnd(0.8, 1.4, s + 6)).toFixed(0));
  const lastMac     = parseFloat((mac * rnd(0.85, 1.2, s + 7)).toFixed(0));
  return {
    baseVol, baseRev, upliftPct, projVol, projRev,
    roi, catRoi, mac, lastMac,
    runtime: new Date().toLocaleString(),
    ...params,
  };
};

// ─── BASELINE DATA ────────────────────────────────────────────────────────────
export const BASELINE_DATA = [
  { sku: "Snickers 50g",      customer: "Retailer X", brand: "Snickers", seasonality: 1.12, date: "2026-P1", forecast: 3420 },
  { sku: "Snickers Multipack",customer: "Retailer Y", brand: "Snickers", seasonality: 0.95, date: "2026-P1", forecast: 1870 },
  { sku: "M&Ms 200g",         customer: "Retailer X", brand: "M&Ms",     seasonality: 1.05, date: "2026-P1", forecast: 2310 },
  { sku: "Twix 50g",          customer: "Retailer Z", brand: "Twix",     seasonality: 0.88, date: "2026-P1", forecast: 1540 },
  { sku: "Pedigree 400g",     customer: "Retailer X", brand: "Pedigree", seasonality: 1.02, date: "2026-P1", forecast: 4100 },
  { sku: "Extra 10pc",        customer: "Retailer Y", brand: "Extra",    seasonality: 1.18, date: "2026-P1", forecast: 2890 },
];

// ─── POST PROMO DATA ──────────────────────────────────────────────────────────
export const POST_PROMO_DATA = [
  { sku: "Snickers 50g",      brand: "Snickers", product: "Snickers Std Bar 50g",     customer: "Retailer X", mechanism: "BOGOF",    start: "2026-01-05", end: "2026-01-18", baseUnits: 3200, salesQty: 5120, promoCost: 8400,  mac: 7200,  roi: 1.24 },
  { sku: "M&Ms 200g",         brand: "M&Ms",     product: "M&Ms Peanut Bag 200g",      customer: "Retailer Y", mechanism: "% Off",    start: "2026-01-12", end: "2026-01-25", baseUnits: 1800, salesQty: 2520, promoCost: 5200,  mac: 3800,  roi: 0.97 },
  { sku: "Snickers Multipack", brand: "Snickers", product: "Snickers Multipack 4x50g", customer: "Retailer Z", mechanism: "Multibuy", start: "2026-02-01", end: "2026-02-14", baseUnits: 1400, salesQty: 2380, promoCost: 6100,  mac: 5600,  roi: 1.38 },
  { sku: "Twix 50g",          brand: "Twix",     product: "Twix Twin Bar 50g",         customer: "Retailer X", mechanism: "Price Cut",start: "2026-02-10", end: "2026-02-23", baseUnits: 2100, salesQty: 2730, promoCost: 4800,  mac: 3200,  roi: 0.84 },
  { sku: "Pedigree 400g",     brand: "Pedigree", product: "Pedigree Adult 400g",       customer: "Retailer Y", mechanism: "TPR",      start: "2026-03-01", end: "2026-03-14", baseUnits: 3800, salesQty: 5320, promoCost: 9200,  mac: 8100,  roi: 1.15 },
  { sku: "Extra 10pc",        brand: "Extra",    product: "Extra Peppermint 10pc",     customer: "Retailer X", mechanism: "BOGOF",    start: "2026-03-15", end: "2026-03-28", baseUnits: 2600, salesQty: 4420, promoCost: 7800,  mac: 6900,  roi: 1.42 },
  { sku: "M&Ms 200g",         brand: "M&Ms",     product: "M&Ms Chocolate Bag 200g",  customer: "Retailer Z", mechanism: "% Off",    start: "2026-04-01", end: "2026-04-14", baseUnits: 1600, salesQty: 2080, promoCost: 4200,  mac: 3100,  roi: 0.93 },
  { sku: "Snickers 50g",      brand: "Snickers", product: "Snickers Std Bar 50g",     customer: "Retailer Y", mechanism: "Multibuy", start: "2026-04-20", end: "2026-05-03", baseUnits: 2900, salesQty: 4640, promoCost: 8900,  mac: 7800,  roi: 1.31 },
];

// ─── PRE VS POST DATA ─────────────────────────────────────────────────────────
export const PRE_POST_DATA = POST_PROMO_DATA.map((row, i) => {
  const s = hash(`prepost-${row.sku}-${i}`);
  const variance = (pre, post) => parseFloat((post - pre).toFixed(2));
  const preCost  = parseFloat((row.promoCost * rnd(0.85, 1.15, s)).toFixed(0));
  const preRev   = parseFloat((row.mac * rnd(0.80, 1.20, s + 1)).toFixed(0));
  const preVol   = Math.round(row.baseUnits * rnd(0.90, 1.10, s + 2));
  const preRoi   = parseFloat(rnd(0.80, 1.60, s + 3).toFixed(2));
  return {
    promoName: `${row.brand} ${row.mechanism} - ${row.customer}`,
    customer:  row.customer,
    start:     row.start,
    end:       row.end,
    brand:     row.brand,
    mechanism: row.mechanism,
    sku:       row.sku,
    preCost,   postCost:  row.promoCost,  costVar:   variance(preCost, row.promoCost),
    preRev,    postRev:   row.mac,        revVar:    variance(preRev, row.mac),
    preVol,    postVol:   row.salesQty,   volVar:    variance(preVol, row.salesQty),
    preRoi,    postRoi:   row.roi,        roiVar:    parseFloat((row.roi - preRoi).toFixed(2)),
  };
});