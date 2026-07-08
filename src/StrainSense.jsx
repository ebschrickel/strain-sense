import { useState, useRef, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import SourcesScreen from "./SourcesScreen";

// ═══════════════════════════════════════════════════════════
// STRAIN SENSE v3 — Make sense of what you're taking.
// ═══════════════════════════════════════════════════════════

// ─── DESIGN TOKENS ──────────────────────────────────────────
// Obsidian Frost — dark botanical glass. Translucent surfaces sit over a
// fixed aurora gradient; `T.glass` adds the frost, `T.grad` is the CTA fill.
const T = {
  color: {
    bg:           "#0e120d",
    bgDeep:       "#0a0c09",
    surface:      "rgba(255,255,255,0.065)",
    surfaceAlt:   "rgba(255,255,255,0.05)",
    white:        "rgba(255,255,255,0.10)",
    border:       "rgba(255,255,255,0.14)",
    borderLight:  "rgba(255,255,255,0.09)",

    text:         "#eef1e8",
    textSec:      "#b9bfae",
    textMuted:    "#7e8476",
    textFaint:    "#5b6055",
    textInv:      "#0d120a",

    green:        "#a4cc86",
    greenDeep:    "#c0dfa8",
    greenLight:   "rgba(164,204,134,0.12)",
    greenMuted:   "#7ba05e",

    am:           "#e0c25a",
    amBg:         "rgba(224,194,90,0.12)",
    pm:           "#a3a6de",
    pmBg:         "rgba(146,149,210,0.14)",
    bal:          "#9db38c",
    balBg:        "rgba(157,179,140,0.13)",

    warn:         "#e07856",
    warnBg:       "rgba(224,120,86,0.13)",
    warnText:     "#f0a385",

    liked:        "#a4cc86",
    likedBg:      "rgba(164,204,134,0.14)",
    neutral:      "#8b9082",
    neutralBg:    "rgba(255,255,255,0.07)",
    disliked:     "#e07856",
    dislikedBg:   "rgba(224,120,86,0.14)",

    cbd:          "#6fd3bd",
    cbdBg:        "rgba(111,211,189,0.12)",
    cbdLight:     "rgba(111,211,189,0.22)",
    pain:         "#d8a878",
    painBg:       "rgba(216,168,120,0.12)",
  },
  font: {
    display:  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
    body:     "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif",
    mono:     "ui-monospace, 'SF Mono', 'IBM Plex Mono', Menlo, monospace",
  },
  radius: { sm: "10px", md: "14px", lg: "22px", pill: "999px", full: "9999px" },
  shadow: {
    sm: "0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)",
    md: "0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.13)",
    hover: "0 12px 36px rgba(0,0,0,0.5), 0 0 24px rgba(164,204,134,0.15), inset 0 1px 0 rgba(255,255,255,0.14)",
  },
  glass: {
    backdropFilter: "blur(28px) saturate(1.4)",
    WebkitBackdropFilter: "blur(28px) saturate(1.4)",
  },
  grad: "linear-gradient(180deg, #6d9852, #52783c)",
  gradGlow: "0 10px 28px rgba(109,152,82,0.35), inset 0 1px 0 rgba(255,255,255,0.30)",
};

// ─── ICON SYSTEM ─────────────────────────────────────────────
// All icons: 24×24 viewBox, stroke-only, 1.5px weight, currentColor.
// Source: Lucide icon set (lucide.dev).
const ICONS = {
  leaf:          <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>,
  camera:        <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,
  fileText:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  compass:       <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
  moon:          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
  sun:           <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  scale:         <><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 7h18"/><path d="M5 7l4 8c0 1.5-1.5 3-4 3s-4-1.5-4-3l4-8z"/><path d="M19 7l4 8c0 1.5-1.5 3-4 3s-4-1.5-4-3l4-8z"/></>,
  waves:         <><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></>,
  zap:           <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  users:         <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  activity:      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
  star:          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  alertTriangle: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  info:          <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  shoppingBag:   <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
  thumbUp:       <><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></>,
  thumbDown:     <><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></>,
  minus:         <line x1="5" y1="12" x2="19" y2="12"/>,
  shield:        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  wind:          <><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></>,
};

function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.5, style: sx }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display:"inline-block", flexShrink:0, ...sx }}>
      {ICONS[name]}
    </svg>
  );
}

// ─── TERPENE ENGINE (PRESERVED EXACTLY) ─────────────────────
const BUCKETS = {
  relaxing:  ["myrcene","betamyrcene","linalool","nerolidol"],
  uplifting: ["limonene","pinene","alphapinene","betapinene","terpinolene","ocimene"],
  balanced:  ["caryophyllene","betacaryophyllene","humulene","bisabolol","guaiol"],
};

const DISPLAY = {
  myrcene:"Myrcene", betamyrcene:"Myrcene", linalool:"Linalool", nerolidol:"Nerolidol",
  limonene:"Limonene", pinene:"Pinene", alphapinene:"α-Pinene", betapinene:"β-Pinene",
  terpinolene:"Terpinolene", ocimene:"Ocimene",
  caryophyllene:"Caryophyllene", betacaryophyllene:"Caryophyllene",
  humulene:"Humulene", bisabolol:"Bisabolol", guaiol:"Guaiol",
};

const NOTES = {
  myrcene:"heavy, sedating, body-focused", betamyrcene:"heavy, sedating, body-focused",
  linalool:"calming, anti-anxiety, sleep-leaning", nerolidol:"relaxation and sedation",
  limonene:"mood elevation and energy", pinene:"alertness and clarity",
  alphapinene:"alertness and clarity", betapinene:"alertness and clarity",
  terpinolene:"uplifting, stimulating, cerebral", ocimene:"energizing, uplifting",
  caryophyllene:"body comfort and grounding", betacaryophyllene:"body comfort and grounding",
  humulene:"subtle calming, anti-inflammatory", bisabolol:"gentle soothing",
  guaiol:"mild relaxation and grounding",
};

// ─── CITATIONS ───────────────────────────────────────────────
// Maps each terpene/claim to source IDs in src/sources.js.
// Required by App Store Review Guideline 1.4.1.
const TERPENE_CITATIONS = {
  myrcene:           [1, 3, 5],
  betamyrcene:       [1, 3, 5],
  linalool:          [3, 7],
  nerolidol:         [3],
  limonene:          [1, 3, 6],
  pinene:            [1, 3, 8],
  alphapinene:       [1, 3, 8],
  betapinene:        [1, 3, 8],
  terpinolene:       [1, 2],
  ocimene:           [2],
  caryophyllene:     [3, 9],
  betacaryophyllene: [3, 9],
  humulene:          [3],
  bisabolol:         [3],
  guaiol:            [3],
};
// General-purpose citation sets used in copy outside the per-terpene UI.
const ENTOURAGE_CITATIONS = [1, 4];   // terpenes matter alongside THC%
const CBD_RATIO_CITATIONS = [10];     // CBD safety / ratio guidance
const SAFETY_CITATIONS    = [11];     // National Academies consensus

function norm(n) { return n.toLowerCase().replace(/[^a-z]/g,""); }

// Inline citation markers — render as [N] [N] tappable to Sources screen.
// Uses a global window callback set by the StrainSense component on mount.
function CitationMarks({ ids }) {
  if (!ids || !ids.length) return null;
  const open = (id) => {
    if (typeof window !== "undefined" && typeof window.__ssOpenSources === "function") {
      window.__ssOpenSources(id);
    }
  };
  return (
    <span style={{ marginLeft: "4px", whiteSpace: "nowrap" }}>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={(e) => { e.stopPropagation(); open(id); }}
          aria-label={`Citation ${id}. Tap for source details.`}
          style={{
            background: "none",
            border: "none",
            padding: "2px 4px",
            marginRight: "1px",
            color: T.color.green,
            fontFamily: T.font.mono,
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
            verticalAlign: "super",
            lineHeight: 1,
            minHeight: "24px",
            minWidth: "24px",
          }}
        >
          [{id}]
        </button>
      ))}
    </span>
  );
}

function parseInput(text) {
  const r = { thc:null, cbd:null, thcMg:null, cbdMg:null, ratio:null, terpenes:[], productType:null, totalTerpenes:null, strainName:null, servingSize:null, terpeneWarnings:[] };
  const lines = text.replace(/\|/g,"\n").replace(/,(?=\s*[a-zA-Z])/g,"\n").split("\n");
  for (const line of lines) {
    const c = line.trim();
    if (!c) continue;

    // Ratio detection: "1:1", "CBD:THC 2:1", "ratio 5:1"
    const ratioMatch = c.match(/(?:ratio|cbd\s*:\s*thc|thc\s*:\s*cbd)?[:\s]*(\d+)\s*:\s*(\d+)/i);
    if (ratioMatch && !r.ratio) {
      let cbdPart = parseInt(ratioMatch[1]), thcPart = parseInt(ratioMatch[2]);
      if (/thc\s*:\s*cbd/i.test(c)) { [cbdPart,thcPart] = [thcPart,cbdPart]; }
      if (!/cbd/i.test(c) && cbdPart < thcPart) { [cbdPart,thcPart] = [thcPart,cbdPart]; }
      r.ratio = { cbd:cbdPart, thc:thcPart, label:`${cbdPart}:${thcPart}` };
      continue;
    }

    // THC/CBD mg
    const thcMg = c.match(/thc[:\s]*(\d+\.?\d*)\s*mg/i);
    if (thcMg) { r.thcMg = parseFloat(thcMg[1]); continue; }
    const cbdMg = c.match(/cbd[:\s]*(\d+\.?\d*)\s*mg/i);
    if (cbdMg) { r.cbdMg = parseFloat(cbdMg[1]); continue; }

    // THC/CBD %
    const thc = c.match(/thc[:\s]*(\d+\.?\d*)%/i) || c.match(/thc[:\s]*(\d+\.?\d*)(?!\s*mg)/i);
    if (thc && !r.thcMg) { r.thc = parseFloat(thc[1]); continue; }
    const cbd = c.match(/cbd[:\s]*(\d+\.?\d*)%/i) || c.match(/cbd[:\s]*(\d+\.?\d*)(?!\s*mg)/i);
    if (cbd && !r.cbdMg) { r.cbd = parseFloat(cbd[1]); continue; }

    // Serving size
    const serving = c.match(/(?:serving|per piece|per gummy|per capsule|per dose)[:\s]*(\d+\.?\d*)\s*mg/i);
    if (serving) { r.servingSize = parseFloat(serving[1]); continue; }

    // Total terpenes
    const tot = c.match(/total\s*terpenes?[:\s]*(\d+\.?\d*)%?/i);
    if (tot) { r.totalTerpenes = parseFloat(tot[1]); continue; }

    // Product type — extended
    const typ = c.match(/\b(flower|vape|cart|cartridge|pre.?roll|edible|gummy|gummies|tincture|oil|capsule|softgel|concentrate|dab|wax|shatter|rosin|live resin|rso|drops)\b/i);
    if (typ) {
      const raw = typ[1].toLowerCase();
      if (["gummy","gummies"].includes(raw)) r.productType = "edible";
      else if (["oil","drops","rso"].includes(raw)) r.productType = "tincture";
      else if (["softgel"].includes(raw)) r.productType = "capsule";
      else r.productType = raw;
      continue;
    }

    // Strain name
    const strain = c.match(/^(?:strain|name|product)[:\s]+(.+)$/i);
    if (strain) { r.strainName = strain[1].trim(); continue; }

    // Terpenes
    const tp = c.match(/^([a-zA-Zα-ωΑ-Ω\- ]+)[:\s]+(\d+\.?\d*)%?$/);
    if (tp) {
      const name = norm(tp[1]); const val = parseFloat(tp[2]);
      if (val > 0 && !name.includes("thc") && !name.includes("cbd") && !name.includes("total") && !name.includes("serving")) {
        r.terpenes.push({ name, value:val, displayName: DISPLAY[name]||tp[1].trim() });
      }
    }
  }

  return finalizeParsed(r);
}

// Shared tail of parsing — used by both free-text paste parsing and the
// guided form, so both entry paths produce identical `parsed` objects.
function finalizeParsed(r) {
  // Infer product type
  if (!r.productType) {
    if (r.thcMg || r.cbdMg) r.productType = "edible";
    else if (r.thc && r.thc > 50) r.productType = "vape";
    else if (r.thc) r.productType = "flower";
  }

  // Build ratio from mg if not explicitly given
  if (!r.ratio && r.thcMg && r.cbdMg) {
    const gcd = (a,b) => b===0?a:gcd(b,a%b);
    const g = gcd(Math.round(r.cbdMg), Math.round(r.thcMg)) || 1;
    r.ratio = { cbd:Math.round(r.cbdMg/g), thc:Math.round(r.thcMg/g), label:`${Math.round(r.cbdMg/g)}:${Math.round(r.thcMg/g)}` };
  }

  r.terpenes.sort((a,b) => b.value - a.value);
  for (const t of r.terpenes) {
    if (!t.noPct && t.value > 2) r.terpeneWarnings.push(`${t.displayName} at ${t.value}% seems unusually high — double-check this value.`);
  }
  if (r.totalTerpenes !== null && r.totalTerpenes > 5) {
    r.terpeneWarnings.push(`Total terpenes at ${r.totalTerpenes}% is very high — may indicate a measurement error or added terpenes.`);
  }
  return r;
}

const EDIBLE_TYPES = ["edible","tincture","capsule"];

function classify(p, tolerance = "regular") {
  const { thc, cbd, thcMg, cbdMg, ratio, terpenes, productType } = p;
  const isVape = ["vape","cart","cartridge","concentrate","dab","wax","shatter","rosin","live resin"].includes(productType);
  const isEdible = EDIBLE_TYPES.includes(productType);
  const isCBDForward = (ratio && ratio.cbd > ratio.thc) || (cbdMg && (!thcMg || cbdMg > thcMg)) || (cbd && (!thc || cbd > thc));

  // ─── Potency ───
  let potency;
  if (isEdible) {
    const dose = thcMg || null;
    if (dose === null && thc === null) potency = "Unknown";
    else if (dose !== null) {
      if (dose <= 2.5) potency = "Microdose";
      else if (dose <= 5) potency = "Low";
      else if (dose <= 10) potency = "Moderate";
      else if (dose <= 25) potency = "High";
      else if (dose <= 50) potency = "Very High";
      else potency = "Extremely Strong";
    } else {
      potency = thc===null?"Unknown":thc<15?"Low":thc<=20?"Moderate":thc<=25?"High":"Very High";
    }
  } else if (isVape) {
    potency = thc===null?"Unknown":thc<70?"Lower-end":thc<=80?"High":thc<=85?"Very High":"Extremely Strong";
  } else {
    potency = thc===null?"Unknown":thc<15?"Low":thc<=20?"Moderate":thc<=25?"High":"Very High";
  }

  // ─── Terpene scoring ───
  let rS=0, uS=0, bS=0;
  for (const t of terpenes) {
    if (BUCKETS.relaxing.includes(t.name)) rS+=t.value;
    else if (BUCKETS.uplifting.includes(t.name)) uS+=t.value;
    else if (BUCKETS.balanced.includes(t.name)) bS+=t.value;
  }
  const tot = rS+uS+bS;
  const rP = tot>0?rS/tot:0, uP = tot>0?uS/tot:0;
  const timing = rP>0.55?"PM / Evening":uP>0.55?"AM / Daytime":"Balanced";
  const highType = rP>0.6?"Body-heavy":uP>0.6?"Head / Cerebral":"Mixed head + body";
  let spectrum = tot>0?(rS-uS)/tot:0;
  spectrum = Math.max(-1,Math.min(1,spectrum));

  // ─── Cautions ───
  const cautions = [];
  if (isEdible) {
    const dose = thcMg || 0;
    if (dose > 25) cautions.push("This is a high-dose edible. Edibles take 30–90 min to kick in — don't re-dose early.");
    if (dose > 10) cautions.push("Beginners should start with 2.5–5 mg and wait at least 2 hours before redosing.");
    if (dose === 0 && thc && thc > 25) cautions.push("High THC — start low, go slow.");
  } else {
    if (tolerance === "new" || tolerance === "occasional") {
      if (thc!==null && ((isVape&&thc>70)||(!isVape&&thc>18))) cautions.push("For new or occasional users, this THC level may feel very intense — start with one small dose and wait.");
      if (thc!==null && ((isVape&&thc>80)||(!isVape&&thc>22))) cautions.push("This potency is not recommended without experienced guidance.");
    } else if (tolerance === "high") {
      if (thc!==null && ((isVape&&thc>92)||(!isVape&&thc>32))) cautions.push("Exceptionally high THC — even for high-tolerance users, starting lower is wise.");
    } else {
      if (thc!==null && ((isVape&&thc>85)||(!isVape&&thc>25))) cautions.push("High THC may override terpene nuance — start low, go slow.");
      if (thc!==null && ((isVape&&thc>80)||(!isVape&&thc>22))) cautions.push("Beginners should approach with extra caution at this potency.");
    }
  }

  // ─── Explanation ───
  const topTerps = terpenes.slice(0,3);
  let explanation = "";
  if (topTerps.length>0) {
    const d = topTerps[0]; const note = NOTES[d.name];
    explanation = `${d.displayName} leads the profile${note?` — often associated with ${note}`:""}. `;
    if (topTerps.length>1) {
      const others = topTerps.slice(1).map(t => `${t.displayName}${NOTES[t.name]?` (${NOTES[t.name]})`:""}`);
      explanation += `Also present: ${others.join("; ")}. `;
    }
  }
  if (isEdible && thcMg) {
    explanation += `At ${thcMg} mg THC per serving, ${potency==="Microdose"||potency==="Low"?"this is a gentle dose suitable for beginners or daytime use.":potency==="Moderate"?"this is a standard dose — noticeable for most people.":"this is a strong dose — experienced users territory."}`;
  } else if (thc!==null) {
    explanation += potency==="Low"||potency==="Moderate"||potency==="Microdose"
      ? "THC is moderate, so effects may feel manageable."
      : "THC is elevated — intensity may be significant regardless of terpene profile.";
  }

  // ─── Ratio & use cases ───
  const cbdThcRatio = (thc!==null && thc>0 && cbd!==null && cbd>0) ? Math.round((cbd/thc)*100)/100 : null;
  let ratioProfile = null;
  if (ratio) {
    ratioProfile = classifyRatio(ratio, terpenes);
  } else if (isCBDForward) {
    const cbdVal = cbdMg || cbd || 0;
    const thcVal = thcMg || thc || 0;
    if (cbdVal > 0) {
      const r = thcVal > 0 ? Math.round(cbdVal/thcVal) : 0;
      ratioProfile = classifyRatio({ cbd:r||1, thc:thcVal>0?1:0, label:thcVal>0?`${r}:1`:"CBD Only" }, terpenes);
    }
  }
  const useCases = classifyUseCases(p, isCBDForward, terpenes, ratioProfile);

  // ─── Product label ───
  let productLabel;
  if (isEdible) productLabel = productType==="tincture"?"Tincture / Oil":productType==="capsule"?"Capsule / Softgel":"Edible / Gummy";
  else if (isVape) productLabel = "Vape / Concentrate";
  else productLabel = "Flower";

  const matchStrength =
    terpenes.length >= 3 && (rP > 0.6 || uP > 0.6) ? "High" :
    terpenes.length >= 2 && (rP > 0.5 || uP > 0.5) ? "Moderate" :
    terpenes.length >= 1 ? "Low" : "Inconclusive";

  return { potency, timing, highType, spectrum, cautions, explanation, topTerps, isVape, isEdible, isCBDForward, productType, productLabel, cbdThcRatio, ratioProfile, useCases, matchStrength };
}

// ─── RATIO INTERPRETER ──────────────────────────────────────
function classifyRatio(ratio, terpenes) {
  const { cbd, thc } = ratio;
  const r = cbd / (thc || 1);
  let category, feel, intoxication, bestFor;
  if (thc === 0 || r >= 20) {
    category = "CBD Dominant"; feel = "Non-intoxicating, functional"; intoxication = "None to minimal";
    bestFor = "Daily wellness, anxiety, inflammation, pain management without impairment";
  } else if (r >= 8) {
    category = "High CBD"; feel = "Very mild, mostly body-focused"; intoxication = "Minimal";
    bestFor = "Pain relief, stress, inflammation — slight relaxation without significant high";
  } else if (r >= 3) {
    category = "CBD-Forward"; feel = "Gentle, grounding, body-present"; intoxication = "Low";
    bestFor = "Moderate pain, anxiety relief with light relaxation — still functional";
  } else if (r >= 1.5) {
    category = "Balanced (CBD-Leaning)"; feel = "Balanced calm with mild euphoria"; intoxication = "Low to moderate";
    bestFor = "Pain and stress relief with a gentle mood lift — good entry point";
  } else if (r >= 0.8) {
    category = "1:1 Balanced"; feel = "Noticeable but grounded — best of both"; intoxication = "Moderate";
    bestFor = "Pain management, sleep, stress — CBD tempers the THC edge";
  } else if (r >= 0.3) {
    category = "THC-Forward"; feel = "Primarily THC-driven with some CBD modulation"; intoxication = "Moderate to high";
    bestFor = "Recreational use with a slightly smoother experience than pure THC";
  } else {
    category = "THC Dominant"; feel = "Standard THC experience"; intoxication = "Full";
    bestFor = "Traditional cannabis effects — CBD is minimal";
  }
  const painTerps = terpenes.filter(t => ["caryophyllene","betacaryophyllene","humulene","myrcene","betamyrcene","linalool"].includes(t.name));
  const painNote = painTerps.length >= 2
    ? `Terpene profile includes ${painTerps.slice(0,2).map(t=>t.displayName).join(" and ")}, which are commonly associated with anti-inflammatory and analgesic properties.`
    : null;
  return { category, feel, intoxication, bestFor, ratio, painNote };
}

// ─── USE-CASE ENGINE ─────────────────────────────────────────
const USE_CASE_TERPENES = {
  pain:    ["caryophyllene","betacaryophyllene","humulene","myrcene","betamyrcene","linalool"],
  anxiety: ["linalool","limonene","caryophyllene","betacaryophyllene","bisabolol"],
  sleep:   ["myrcene","betamyrcene","linalool","nerolidol"],
};
function classifyUseCases(parsed, isCBDForward, terpenes, ratioProfile) {
  const cases = [];
  const terpNames = terpenes.map(t => t.name);
  // Pain
  const painTerps = USE_CASE_TERPENES.pain.filter(t => terpNames.includes(t));
  let painScore = painTerps.length;
  if (isCBDForward) painScore += 2;
  if (ratioProfile && ["1:1 Balanced","Balanced (CBD-Leaning)","CBD-Forward","High CBD","CBD Dominant"].includes(ratioProfile.category)) painScore += 2;
  if (terpNames.includes("caryophyllene")||terpNames.includes("betacaryophyllene")) painScore += 1;
  if (painScore >= 3) cases.push({
    id:"pain", icon:"shield", label:"Pain & Inflammation",
    strength: painScore >= 5 ? "Strong match" : "Moderate match",
    note: `${isCBDForward?"CBD content":"Terpene profile"} suggests potential for body comfort and anti-inflammatory support.${painTerps.length>0?` Key terpenes: ${painTerps.slice(0,3).map(t=>DISPLAY[t]||t).join(", ")}.`:""}`,
  });
  // Anxiety
  const anxTerps = USE_CASE_TERPENES.anxiety.filter(t => terpNames.includes(t));
  let anxScore = anxTerps.length;
  if (isCBDForward) anxScore += 2;
  if (terpNames.includes("linalool")) anxScore += 1;
  if (anxScore >= 3) cases.push({
    id:"anxiety", icon:"wind", label:"Anxiety & Stress",
    strength: anxScore >= 5 ? "Strong match" : "Moderate match",
    note: `Profile includes terpenes commonly associated with calming and anxiolytic effects.${anxTerps.length>0?` Key terpenes: ${anxTerps.slice(0,3).map(t=>DISPLAY[t]||t).join(", ")}.`:""}`,
  });
  // Sleep
  const sleepTerps = USE_CASE_TERPENES.sleep.filter(t => terpNames.includes(t));
  let sleepScore = sleepTerps.length;
  if (terpNames.includes("myrcene")||terpNames.includes("betamyrcene")) sleepScore += 1;
  if (terpNames.includes("linalool")) sleepScore += 1;
  if (parsed.thcMg && parsed.thcMg >= 5) sleepScore += 1;
  if (sleepScore >= 3) cases.push({
    id:"sleep", icon:"moon", label:"Sleep Support",
    strength: sleepScore >= 5 ? "Strong match" : "Moderate match",
    note: `Sedating terpenes suggest this may support sleep onset and quality.${sleepTerps.length>0?` Key terpenes: ${sleepTerps.slice(0,3).map(t=>DISPLAY[t]||t).join(", ")}.`:""}`,
  });
  return cases;
}

// ─── COMPARISON ENGINE ──────────────────────────────────────
function generateComparison(aResult, bResult, aName, bName) {
  const nA = aName || "Product A";
  const nB = bName || "Product B";
  const parts = [];

  // Timing difference
  if (aResult.timing !== bResult.timing) {
    const aTime = aResult.timing.includes("PM") ? "more evening-leaning" : aResult.timing.includes("AM") ? "more daytime-leaning" : "balanced";
    const bTime = bResult.timing.includes("PM") ? "more evening-leaning" : bResult.timing.includes("AM") ? "more daytime-leaning" : "balanced";
    parts.push(`${nA} is ${aTime}, while ${nB} is ${bTime}.`);
  } else {
    parts.push(`Both products lean ${aResult.timing.toLowerCase()}.`);
  }

  // Terpene differences
  const aTerps = aResult.topTerps.map(t => t.displayName);
  const bTerps = bResult.topTerps.map(t => t.displayName);
  const aOnly = aTerps.filter(t => !bTerps.includes(t));
  const bOnly = bTerps.filter(t => !aTerps.includes(t));

  if (aOnly.length > 0 || bOnly.length > 0) {
    if (aOnly.length > 0) parts.push(`${nA} features ${aOnly.join(" and ")}, which may contribute to its ${aResult.highType.toLowerCase()} character.`);
    if (bOnly.length > 0) parts.push(`${nB} features ${bOnly.join(" and ")}, which may contribute to its ${bResult.highType.toLowerCase()} character.`);
  }

  // Potency
  if (aResult.potency !== bResult.potency) {
    parts.push(`${nA} is ${aResult.potency.toLowerCase()} potency vs. ${nB} at ${bResult.potency.toLowerCase()}.`);
  }

  // CBD-forward contrast
  if (aResult.isCBDForward !== bResult.isCBDForward) {
    const cbdOne = aResult.isCBDForward ? nA : nB;
    const thcOne = aResult.isCBDForward ? nB : nA;
    parts.push(`${cbdOne} is CBD-forward while ${thcOne} is THC-dominant — very different experiences.`);
  }

  return parts.join(" ");
}

// ─── MOOD PRESETS ───────────────────────────────────────────
const MOOD_PRESETS = [
  { id:"relax", icon:"waves", label:"Relaxed & Calm", desc:"Wind down, melt tension", terpenes:["linalool","myrcene","nerolidol"], timing:"PM / Evening", highType:"Body-heavy", thcRange:"Low–Moderate",
    note:"Expect a settling, body-heavy effect — good for unwinding at the end of the day. Effects vary by person and product." },
  { id:"energy", icon:"zap", label:"Energized & Focused", desc:"Daytime clarity, get things done", terpenes:["limonene","pinene","terpinolene"], timing:"AM / Daytime", highType:"Head / Cerebral", thcRange:"Low–Moderate",
    note:"Expect a clearer head and more mental energy — best used when you need to stay sharp. Individual response varies." },
  { id:"social", icon:"users", label:"Social & Uplifted", desc:"Good vibes, conversation", terpenes:["limonene","terpinolene","ocimene"], timing:"AM / Daytime", highType:"Head / Cerebral", thcRange:"Low–Moderate",
    note:"Expect an uplifted, sociable mood — this profile tends to reduce inhibition without heavy sedation. Individual response varies." },
  { id:"sleep", icon:"moon", label:"Sleep & Recovery", desc:"Heavy body, full shutdown", terpenes:["myrcene","linalool","nerolidol"], timing:"PM / Evening", highType:"Body-heavy", thcRange:"Moderate–High",
    note:"Expect deep physical relaxation and a heaviness that supports sleep onset. Not recommended if you need to stay alert." },
  { id:"balanced", icon:"activity", label:"Balanced & Grounded", desc:"Even-keel, centered", terpenes:["caryophyllene","humulene","bisabolol"], timing:"Balanced", highType:"Mixed head + body", thcRange:"Low–Moderate",
    note:"Expect a grounded, even-keel effect — neither too sedating nor too stimulating. A good starting point for any time of day." },
  { id:"creative", icon:"star", label:"Creative & Exploratory", desc:"Open-minded, playful", terpenes:["terpinolene","limonene","pinene"], timing:"AM / Daytime", highType:"Head / Cerebral", thcRange:"Moderate",
    note:"Expect an open, curious headspace — this profile tends to support divergent thinking. Higher THC can amplify or overwhelm, so start low." },
  { id:"pain", icon:"shield", label:"Pain & Inflammation", desc:"Body comfort, anti-inflammatory", terpenes:["caryophyllene","humulene","myrcene"], timing:"PM / Evening", highType:"Body-heavy", thcRange:"Moderate–High",
    extra:"For pain, also look for CBD-forward products (2:1 or higher CBD:THC ratio). Caryophyllene is unique — it binds to CB2 receptors, which are involved in inflammation and pain signaling.",
    note:"Expect body-focused relief — this profile is used for physical discomfort and inflammation. Effects vary significantly by tolerance and product type." },
  { id:"anxiety", icon:"wind", label:"Calm Anxiety", desc:"Quiet the noise, steady the mind", terpenes:["linalool","limonene","bisabolol"], timing:"Balanced", highType:"Mixed head + body", thcRange:"Low",
    extra:"CBD-forward products (especially 4:1 or higher) are often preferred for anxiety because they provide calming effects without significant intoxication.",
    note:"Expect a calming, quieting effect — this profile is selected for mental ease over physical sedation. Keep THC low; high doses can worsen anxiety." },
];

// ─── PERSISTENT STORAGE ─────────────────────────────────────
const STORAGE_KEY   = "strain-sense-saved";
const TOLERANCE_KEY = "strain-sense-tolerance";
const AGE_GATE_KEY    = "strain-sense-age-verified";
const DISCLAIMER_KEY  = "strain-sense-disclaimer-seen";

// ─── AGE GATE ───────────────────────────────────────────────
function AgeGate({ onConfirm }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background: `
        radial-gradient(70% 42% at 80% -5%, rgba(94,148,74,0.28) 0%, transparent 60%),
        radial-gradient(80% 50% at 50% 112%, rgba(52,92,60,0.30) 0%, transparent 62%),
        linear-gradient(178deg, #0e120d 0%, #0a0c09 100%)`,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 28px", textAlign:"center",
      fontFamily:T.font.body,
    }}>
      <div style={{ marginBottom:"20px" }}><Icon name="leaf" size={40} color={T.color.green} /></div>
      <h1 style={{ fontFamily:T.font.display, fontSize:"28px", fontWeight:750, color:T.color.text, margin:"0 0 12px 0", letterSpacing:"-0.03em" }}>
        Strain Sense
      </h1>
      <p style={{ fontSize:"15px", color:T.color.textSec, marginBottom:"36px", maxWidth:"300px", lineHeight:1.65, fontFamily:T.font.body }}>
        This app contains information about cannabis products.
        You must be <strong style={{color:T.color.text}}>21 or older</strong> to continue.
      </p>
      <button
        onClick={onConfirm}
        style={{
          background:T.grad, color:T.color.textInv,
          border:"none", borderRadius:"18px",
          padding:"15px 32px", fontSize:"15px", fontWeight:650,
          fontFamily:T.font.body, letterSpacing:"-0.01em",
          boxShadow:T.gradGlow,
          cursor:"pointer", marginBottom:"20px", width:"100%", maxWidth:"300px",
        }}
      >
        I am 21 or older
      </button>
      <p style={{ fontSize:"12px", color:T.color.textMuted, maxWidth:"280px", lineHeight:1.6, fontFamily:T.font.body }}>
        By continuing, you confirm you are of legal age in your jurisdiction.
        This app is for educational purposes only and does not provide medical advice.
      </p>
    </div>
  );
}

async function loadSaved() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

async function saveToDisk(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) { console.error("Storage save failed:", e); }
}

// ─── UNIQUE IDS ─────────────────────────────────────────────
let _id = 0;
function uid() { return `ss_${++_id}_${Date.now()}`; }

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function Pill({ children, bg, color, small, onClick, active }) {
  return (
    <span onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:"4px",
      padding: small ? "3px 10px" : "5px 14px",
      borderRadius: T.radius.pill,
      fontSize: small ? "11px" : "12px",
      fontWeight: 500, fontFamily: T.font.mono,
      color: color||T.color.text,
      background: bg||T.color.surfaceAlt,
      cursor: onClick ? "pointer" : "default",
      border: active ? `1.5px solid ${color||T.color.green}` : "1.5px solid transparent",
      transition: "all 0.15s ease",
      letterSpacing: "0.02em",
      userSelect: "none",
    }}>{children}</span>
  );
}

function StatBox({ label, value, unit, type }) {
  const typeStyles = {
    thc:     { bg: T.color.amBg,      labelColor: T.color.am },
    cbd:     { bg: T.color.pmBg,      labelColor: T.color.pm },
    ratio:   { bg: T.color.balBg,     labelColor: T.color.bal },
    terpene: { bg: T.color.greenLight, labelColor: T.color.green },
  };
  const ts = typeStyles[type] || { bg: T.color.surfaceAlt, labelColor: T.color.textMuted };
  return (
    <div style={{
      background: ts.bg, borderRadius: T.radius.md,
      padding: "18px 12px", textAlign:"center", minWidth:"90px", flex:"1 1 90px",
      borderTop: `1px solid ${ts.labelColor}`,
    }}>
      <div style={{ fontSize:"11px", color:ts.labelColor, letterSpacing:"0.08em", fontFamily:T.font.mono, textTransform:"uppercase", marginBottom:"3px" }}>{label}</div>
      <div style={{ fontSize:"24px", fontWeight:700, color:T.color.text, fontFamily:T.font.display }}>{value}<span style={{fontSize:"14px",fontWeight:400}}>{unit||""}</span></div>
    </div>
  );
}

function Spectrum({ value, compact }) {
  const pct = ((value+1)/2)*100;
  return (
    <div style={{ margin: compact?"10px 0":"18px 0" }}>
      <div style={{
        background: compact ? "transparent" : T.color.surfaceAlt,
        borderRadius: compact ? "0" : T.radius.md,
        padding: compact ? "0" : "14px",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", letterSpacing:"0.07em", color:T.color.textMuted, marginBottom:"5px", fontFamily:T.font.mono }}>
          <span style={{display:"flex",alignItems:"center",gap:"3px"}}><Icon name="sun" size={11} /> DAYTIME</span>
          <span>BALANCED</span>
          <span style={{display:"flex",alignItems:"center",gap:"3px"}}>EVENING <Icon name="moon" size={11} /></span>
        </div>
        <div style={{ position:"relative", height: compact?"8px":"12px", borderRadius:"5px",
          background:`linear-gradient(90deg, #dbb934 0%, #b8b490 50%, #7072a8 100%)` }}>
          <div style={{
            position:"absolute", top: compact?"-2px":"-3px", left:`calc(${pct}% - 8px)`,
            width: compact?"12px":"16px", height: compact?"12px":"16px", borderRadius:T.radius.full,
            background:T.color.text, border:`2px solid ${T.color.bg}`,
            boxShadow:T.shadow.sm, transition:"left 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}/>
        </div>
      </div>
    </div>
  );
}

function Alert({ variant, children }) {
  const s = variant==="warn" ? {bg:T.color.warnBg,c:T.color.warnText,icon:"alertTriangle",border:T.color.warn}
    : variant==="info" ? {bg:T.color.greenLight,c:T.color.green,icon:"info",border:T.color.green}
    : {bg:T.color.surfaceAlt,c:T.color.textMuted,icon:null,border:T.color.border};
  return (
    <div style={{ background:s.bg, borderRadius:T.radius.lg, padding:"14px 16px",
      fontSize:"13px", color:s.c, lineHeight:1.6, fontFamily:T.font.body,
      borderLeft:`3px solid ${s.border}`, display:"flex", alignItems:"flex-start", gap:"8px" }}>
      {s.icon && <Icon name={s.icon} size={14} color={s.c} style={{flexShrink:0,marginTop:"1px"}} />}
      <span>{children}</span>
    </div>
  );
}

function Btn({ children, primary, small, onClick, disabled, style: sx }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
      padding: small ? "7px 16px" : "11px 20px",
      borderRadius: small ? T.radius.pill : T.radius.md,
      border: primary ? "none" : `1px solid ${disabled ? T.color.borderLight : T.color.border}`,
      background: disabled
        ? T.color.surfaceAlt
        : primary ? T.grad : T.color.surface,
      boxShadow: primary && !disabled ? T.gradGlow : "none",
      color: disabled ? T.color.textMuted : primary ? T.color.textInv : T.color.textSec,
      cursor: disabled ? "default" : "pointer",
      fontSize: small ? "12px" : "14px",
      fontWeight: primary ? 650 : 500,
      fontFamily: T.font.body,
      letterSpacing: "-0.01em",
      transition: "all 0.15s",
      ...sx,
    }}>{children}</button>
  );
}

// ─── TOLERANCE SELECTOR ─────────────────────────────────────
function ToleranceSelector({ value, onChange }) {
  const levels = [
    { key:"new", label:"New" },
    { key:"occasional", label:"Occasional" },
    { key:"regular", label:"Regular" },
    { key:"high", label:"High Tolerance" },
  ];
  return (
    <div>
      <div style={{ fontSize:"11px", color:T.color.textMuted, letterSpacing:"0.08em", fontFamily:T.font.mono, textTransform:"uppercase", marginBottom:"6px" }}>Experience Level</div>
      <div style={{ display:"flex", gap:"4px" }}>
        {levels.map(l => (
          <button key={l.key} onClick={()=>onChange(l.key)} style={{
            flex:1, padding:"7px 6px", borderRadius:T.radius.md,
            border:`1px solid ${value===l.key?T.color.greenMuted:T.color.borderLight}`,
            background:value===l.key?T.color.greenLight:T.color.surfaceAlt,
            color:value===l.key?T.color.green:T.color.textMuted,
            fontSize:"12px", fontFamily:T.font.mono, fontWeight:value===l.key?500:400,
            cursor:"pointer", transition:"all 0.15s",
          }}>{l.label}</button>
        ))}
      </div>
    </div>
  );
}

// ─── COUNTER CARD (BUDTENDER VIEW) ───────────────────────────
const TERPENE_PLAIN = {
  myrcene:"Earthy, relaxing", betamyrcene:"Earthy, relaxing",
  linalool:"Calming, floral", nerolidol:"Soothing, woodsy",
  limonene:"Citrusy, uplifting", pinene:"Fresh, alert",
  alphapinene:"Fresh, alert", betapinene:"Fresh, alert",
  terpinolene:"Fruity, stimulating", ocimene:"Sweet, energizing",
  caryophyllene:"Spicy, grounding", betacaryophyllene:"Spicy, grounding",
  humulene:"Earthy, mild", bisabolol:"Gentle, soothing",
  guaiol:"Pine, relaxing",
};

function buildBudtenderScript(parsed, result) {
  const timingWord = result.timing.includes("PM") ? "evening"
    : result.timing.includes("AM") ? "daytime" : "flexible time-of-day";
  const effectWord = result.highType === "Body-heavy" ? "body-heavy"
    : result.highType === "Head / Cerebral" ? "uplifting, head-focused"
    : "balanced";
  const productWord = result.isEdible
    ? (parsed.productType === "tincture" ? "tincture" : "edible")
    : result.isVape ? "vape or concentrate" : "flower";
  const potencyWord = ["Very High","Extremely Strong"].includes(result.potency) ? "high"
    : result.potency === "High" ? "higher" : result.potency === "Low" || result.potency === "Microdose" ? "low" : "moderate";
  const terpPart = result.topTerps.length > 0
    ? ` and ${result.topTerps[0].displayName}-forward terpenes` : "";
  const cbdPart = result.isCBDForward ? ", CBD-forward" : "";
  return `I'm looking for a ${effectWord}, ${timingWord} ${productWord} with ${potencyWord} THC${cbdPart}${terpPart}.`;
}

function CounterCard({ parsed, result, onClose }) {
  const timingMeta = result.timing.includes("PM")
    ? {icon:"moon", c:T.color.pm}
    : result.timing.includes("AM")
    ? {icon:"sun", c:T.color.am}
    : {icon:"scale", c:T.color.bal};
  const budtenderScript = buildBudtenderScript(parsed, result);

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(5,7,5,0.60)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:"20px",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"rgba(24,28,22,0.85)", borderRadius:T.radius.lg,
        border:`1px solid ${T.color.border}`,
        padding:"32px 28px", maxWidth:"400px", width:"100%",
        boxShadow:"0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.14)",
        ...T.glass,
      }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ marginBottom:"10px" }}><Icon name={timingMeta.icon} size={36} color={timingMeta.c} /></div>
          <h2 style={{ fontFamily:T.font.display, fontSize:"23px", fontWeight:750, letterSpacing:"-0.02em", margin:"0 0 4px 0", color:T.color.text }}>
            Show This at the Counter
          </h2>
          <div style={{ fontSize:"13px", color:T.color.textSec, fontFamily:T.font.body }}>
            Looking for something like this:
          </div>
        </div>

        {/* Key numbers */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
          {parsed.thc!==null && (
            <div style={{ background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"12px", textAlign:"center", flex:"0 0 auto", minWidth:"80px" }}>
              <div style={{ fontSize:"11px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"2px" }}>THC</div>
              <div style={{ fontSize:"22px", fontWeight:700, fontFamily:T.font.display }}>{parsed.thc}%</div>
            </div>
          )}
          {parsed.cbd!==null && parsed.cbd>0 && (
            <div style={{ background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"12px", textAlign:"center", flex:"0 0 auto", minWidth:"70px" }}>
              <div style={{ fontSize:"11px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"2px" }}>CBD</div>
              <div style={{ fontSize:"22px", fontWeight:700, fontFamily:T.font.display }}>{parsed.cbd}%</div>
            </div>
          )}
          <div style={{ background:T.color.greenLight, borderRadius:T.radius.md, padding:"12px", textAlign:"center", flex:1 }}>
            <div style={{ fontSize:"11px", color:T.color.green, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"2px" }}>Effect</div>
            <div style={{ fontSize:"16px", fontWeight:600, color:T.color.green, fontFamily:T.font.display, lineHeight:1.2 }}>{result.highType}</div>
          </div>
        </div>

        {/* Top terpenes */}
        {result.topTerps.length>0 && (
          <div style={{ marginBottom:"20px" }}>
            <div style={{ fontSize:"11px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>Top Terpenes</div>
            {result.topTerps.map((t,i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"9px 0",
                borderBottom: i<result.topTerps.length-1 ? `1px solid ${T.color.borderLight}` : "none",
              }}>
                <span style={{ fontFamily:T.font.body, fontSize:"15px", fontWeight:500, color:T.color.text }}>{t.displayName}</span>
                <span style={{ fontFamily:T.font.mono, fontSize:"12px", color:T.color.textMuted }}>{TERPENE_PLAIN[t.name]||""}</span>
              </div>
            ))}
          </div>
        )}

        {/* Budtender script */}
        <div style={{ marginBottom:"20px" }}>
          <div style={{ fontSize:"11px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>Tell the budtender:</div>
          <div style={{
            background:T.color.surfaceAlt, borderRadius:T.radius.lg, padding:"16px 18px",
            fontSize:"15px", lineHeight:1.65, color:T.color.text, fontFamily:T.font.body,
            fontStyle:"italic", borderLeft:`3px solid ${T.color.green}`,
          }}>{budtenderScript}</div>
        </div>

        <Btn onClick={onClose} style={{ width:"100%", textAlign:"center" }}>Close</Btn>
      </div>
    </div>
  );
}

// ─── RATIO CARD ─────────────────────────────────────────────
function RatioCard({ ratioProfile }) {
  if (!ratioProfile) return null;
  const rp = ratioProfile;
  return (
    <div style={{
      background:T.color.cbdBg, borderRadius:T.radius.lg, padding:"18px",
      border:`1px solid ${T.color.cbd}33`, marginTop:"16px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
        <div style={{ fontFamily:T.font.display, fontSize:"16px", fontWeight:650, letterSpacing:"-0.01em", color:T.color.cbd }}>CBD:THC Ratio</div>
        <Pill small bg={T.color.cbdLight} color={T.color.cbd}>{rp.ratio.label}</Pill>
        <Pill small bg={T.color.cbdLight} color={T.color.cbd}>{rp.category}</Pill>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
        <div>
          <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.textMuted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"3px" }}>Expected Feel</div>
          <div style={{ fontSize:"13px", color:T.color.textSec, fontFamily:T.font.body }}>{rp.feel}</div>
        </div>
        <div>
          <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.textMuted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"3px" }}>Intoxication</div>
          <div style={{ fontSize:"13px", color:T.color.textSec, fontFamily:T.font.body }}>{rp.intoxication}</div>
        </div>
      </div>
      <div style={{ fontSize:"13px", color:T.color.textSec, fontFamily:T.font.body, lineHeight:1.6, marginBottom:rp.painNote?"10px":"0" }}>
        <strong style={{ color:T.color.cbd }}>Best for:</strong> {rp.bestFor}
      </div>
      {rp.painNote && (
        <div style={{
          fontSize:"12px", color:T.color.pain, fontFamily:T.font.body, lineHeight:1.5,
          background:T.color.painBg, borderRadius:T.radius.md, padding:"10px 12px",
          display:"flex", gap:"8px", alignItems:"flex-start",
        }}>
          <Icon name="shield" size={14} color={T.color.pain} style={{ flexShrink:0, marginTop:"1px" }} />
          <span>{rp.painNote}</span>
        </div>
      )}
    </div>
  );
}

// ─── USE-CASE BADGES ─────────────────────────────────────────
function UseCaseBadges({ useCases }) {
  if (!useCases || useCases.length === 0) return null;
  return (
    <div style={{ marginTop:"16px" }}>
      <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"8px" }}>May be helpful for</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {useCases.map(uc => (
          <div key={uc.id} style={{
            background:T.color.surface, borderRadius:T.radius.md, padding:"14px",
            border:`1px solid ${T.color.borderLight}`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"5px" }}>
              <Icon name={uc.icon} size={16} color={T.color.green} />
              <span style={{ fontFamily:T.font.display, fontSize:"14px", fontWeight:650, color:T.color.text }}>{uc.label}</span>
              <Pill small bg={uc.strength==="Strong match"?T.color.greenLight:T.color.surfaceAlt} color={uc.strength==="Strong match"?T.color.green:T.color.textMuted}>{uc.strength}</Pill>
            </div>
            <div style={{ fontSize:"12px", color:T.color.textMuted, fontFamily:T.font.body, lineHeight:1.5 }}>{uc.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GUIDED PRODUCT FORM ────────────────────────────────────
// Paste-first entry: paste the label text and auto-fill, or tap in the
// details. Terpenes are selectable chips; percentages are optional.
const COMMON_TERPENES = ["myrcene","limonene","caryophyllene","linalool","pinene","terpinolene","humulene","ocimene","bisabolol","nerolidol","guaiol"];
const PRODUCT_TYPES = [
  { key:"flower",      label:"Flower" },
  { key:"vape",        label:"Vape / Cart" },
  { key:"edible",      label:"Edible / Gummy" },
  { key:"tincture",    label:"Tincture / Oil" },
  { key:"capsule",     label:"Capsule" },
  { key:"concentrate", label:"Concentrate" },
];
// Nominal scoring weight for a terpene listed without a percentage.
const NO_PCT_WEIGHT = 0.3;

const FIELD_STYLE = {
  width:"100%", padding:"13px 14px", borderRadius:T.radius.md,
  border:`1px solid ${T.color.border}`, background:T.color.surfaceAlt,
  color:T.color.text, fontSize:"16px", fontFamily:T.font.body,
  boxShadow:"inset 0 1px 2px rgba(0,0,0,0.25)",
};

function FormLabel({ children }) {
  return (
    <div style={{ fontSize:"11px", color:T.color.textMuted, letterSpacing:"0.08em", fontFamily:T.font.mono, textTransform:"uppercase", marginBottom:"8px" }}>
      {children}
    </div>
  );
}

function ProductForm({ onAnalyze, onBack }) {
  const [form, setForm] = useState({ strainName:"", productType:null, thc:"", cbd:"", thcMg:"", cbdMg:"", terps:{} });
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState(null);
  const [error, setError] = useState(null);

  const setF = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const isEdibleTy = EDIBLE_TYPES.includes(form.productType);

  const toggleTerp = (name) => setForm(f => {
    const terps = { ...f.terps };
    if (name in terps) delete terps[name];
    else terps[name] = "";
    return { ...f, terps };
  });

  const applyPaste = () => {
    const r = parseInput(paste);
    const empty = r.terpenes.length===0 && r.thc===null && r.thcMg===null && r.cbd===null && r.cbdMg===null && !r.strainName;
    if (empty) {
      setNote("Couldn't find product data in that text — you can still fill in the fields below.");
      return;
    }
    const terps = {};
    for (const t of r.terpenes) terps[t.name] = String(t.value);
    setForm({
      strainName: r.strainName || "",
      productType: r.productType || null,
      thc:   r.thc   !== null ? String(r.thc)   : "",
      cbd:   r.cbd   !== null ? String(r.cbd)   : "",
      thcMg: r.thcMg !== null ? String(r.thcMg) : "",
      cbdMg: r.cbdMg !== null ? String(r.cbdMg) : "",
      terps,
    });
    setNote("Auto-filled from your paste — double-check the values below, then analyze.");
    setError(null);
  };

  const num = (s) => {
    const v = parseFloat(s);
    return Number.isFinite(v) && v > 0 ? v : null;
  };

  const handleAnalyze = () => {
    const r = {
      thc:num(form.thc), cbd:num(form.cbd), thcMg:num(form.thcMg), cbdMg:num(form.cbdMg),
      ratio:null, terpenes:[], productType:form.productType, totalTerpenes:null,
      strainName:form.strainName.trim() || null, servingSize:null, terpeneWarnings:[],
    };
    for (const [name, pct] of Object.entries(form.terps)) {
      const v = num(pct);
      const displayName = DISPLAY[name] || name.charAt(0).toUpperCase() + name.slice(1);
      r.terpenes.push(v !== null
        ? { name, value:v, displayName }
        : { name, value:NO_PCT_WEIGHT, displayName, noPct:true });
    }
    if (r.thc===null && r.cbd===null && r.thcMg===null && r.cbdMg===null && r.terpenes.length===0) {
      setError("Add at least a THC or CBD value, or select one terpene, to analyze.");
      return;
    }
    setError(null);
    onAnalyze(finalizeParsed(r));
  };

  // Chips: common list first, plus any pasted terpenes we don't list.
  const extraTerps = Object.keys(form.terps).filter(n => !COMMON_TERPENES.includes(n));
  const chipTerps = [...COMMON_TERPENES, ...extraTerps];
  const selectedTerps = Object.keys(form.terps);

  return (
    <div style={{ animation:"ssReveal 0.3s ease-out", display:"flex", flexDirection:"column", gap:"14px" }}>

      {/* ── Paste-first card ── */}
      <div style={{ background:T.color.surface, borderRadius:T.radius.lg, padding:"18px", border:`1px solid ${T.color.borderLight}`, boxShadow:T.shadow.sm, ...T.glass }}>
        <FormLabel>Fastest way — paste the label</FormLabel>
        <textarea
          value={paste} onChange={e=>setPaste(e.target.value)} rows={3}
          placeholder={"Paste anything with the numbers in it, e.g.\nBlue Dream  THC: 22.3%  Myrcene: 0.45%"}
          style={{ ...FIELD_STYLE, fontFamily:T.font.mono, fontSize:"14px", lineHeight:1.6, resize:"vertical", marginBottom:"10px" }}
        />
        <Btn primary onClick={applyPaste} disabled={!paste.trim()} style={{ width:"100%" }}>Auto-Fill From Paste</Btn>
        {note && (
          <div style={{ marginTop:"10px", fontSize:"12.5px", color:T.color.green, fontFamily:T.font.body, lineHeight:1.5, display:"flex", gap:"6px", alignItems:"flex-start" }}>
            <Icon name="info" size={14} color={T.color.green} style={{ flexShrink:0, marginTop:"1px" }} />
            <span>{note}</span>
          </div>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"2px 0" }}>
        <div style={{ flex:1, height:"1px", background:T.color.borderLight }} />
        <span style={{ fontSize:"11px", color:T.color.textFaint, fontFamily:T.font.mono, letterSpacing:"0.08em" }}>OR ENTER DETAILS</span>
        <div style={{ flex:1, height:"1px", background:T.color.borderLight }} />
      </div>

      {/* ── Guided form ── */}
      <div style={{ background:T.color.surface, borderRadius:T.radius.lg, padding:"18px", border:`1px solid ${T.color.borderLight}`, boxShadow:T.shadow.sm, ...T.glass, display:"flex", flexDirection:"column", gap:"18px" }}>

        <div>
          <FormLabel>Strain / product name <span style={{opacity:0.6}}>(optional)</span></FormLabel>
          <input
            type="text" value={form.strainName} onChange={e=>setF("strainName", e.target.value)}
            placeholder="e.g. Blue Dream" autoCapitalize="words" style={FIELD_STYLE}
          />
        </div>

        <div>
          <FormLabel>Product type</FormLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
            {PRODUCT_TYPES.map(pt => {
              const active = form.productType === pt.key;
              return (
                <button key={pt.key} onClick={()=>setF("productType", active ? null : pt.key)} style={{
                  padding:"9px 14px", borderRadius:T.radius.pill,
                  border:`1px solid ${active ? "rgba(164,204,134,0.55)" : T.color.borderLight}`,
                  background: active ? T.color.greenLight : T.color.surfaceAlt,
                  color: active ? T.color.green : T.color.textSec,
                  fontSize:"13px", fontFamily:T.font.body, fontWeight: active ? 600 : 400,
                  cursor:"pointer", transition:"all 0.15s",
                }}>{pt.label}</button>
              );
            })}
          </div>
        </div>

        <div>
          <FormLabel>Potency {isEdibleTy ? "— mg per serving" : "— %"}</FormLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {isEdibleTy ? (
              <>
                <div style={{ position:"relative" }}>
                  <input type="text" inputMode="decimal" value={form.thcMg} onChange={e=>setF("thcMg", e.target.value)}
                    placeholder="THC" aria-label="THC milligrams per serving" style={FIELD_STYLE} />
                  <span style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color:T.color.textFaint, fontFamily:T.font.mono }}>mg</span>
                </div>
                <div style={{ position:"relative" }}>
                  <input type="text" inputMode="decimal" value={form.cbdMg} onChange={e=>setF("cbdMg", e.target.value)}
                    placeholder="CBD" aria-label="CBD milligrams per serving" style={FIELD_STYLE} />
                  <span style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color:T.color.textFaint, fontFamily:T.font.mono }}>mg</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ position:"relative" }}>
                  <input type="text" inputMode="decimal" value={form.thc} onChange={e=>setF("thc", e.target.value)}
                    placeholder="THC" aria-label="THC percent" style={FIELD_STYLE} />
                  <span style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color:T.color.textFaint, fontFamily:T.font.mono }}>%</span>
                </div>
                <div style={{ position:"relative" }}>
                  <input type="text" inputMode="decimal" value={form.cbd} onChange={e=>setF("cbd", e.target.value)}
                    placeholder="CBD" aria-label="CBD percent" style={FIELD_STYLE} />
                  <span style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color:T.color.textFaint, fontFamily:T.font.mono }}>%</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <FormLabel>Terpenes — tap what's on the label</FormLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
            {chipTerps.map(name => {
              const active = name in form.terps;
              const displayName = DISPLAY[name] || name.charAt(0).toUpperCase() + name.slice(1);
              return (
                <button key={name} onClick={()=>toggleTerp(name)} style={{
                  padding:"9px 14px", borderRadius:T.radius.pill,
                  border:`1px solid ${active ? "rgba(164,204,134,0.55)" : T.color.borderLight}`,
                  background: active ? T.color.greenLight : T.color.surfaceAlt,
                  color: active ? T.color.green : T.color.textSec,
                  fontSize:"13px", fontFamily:T.font.body, fontWeight: active ? 600 : 400,
                  cursor:"pointer", transition:"all 0.15s",
                }}>{active ? "✓ " : ""}{displayName}</button>
              );
            })}
          </div>

          {selectedTerps.length > 0 && (
            <div style={{ marginTop:"14px", display:"flex", flexDirection:"column", gap:"8px" }}>
              {selectedTerps.map(name => {
                const displayName = DISPLAY[name] || name.charAt(0).toUpperCase() + name.slice(1);
                return (
                  <div key={name} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"14px", fontWeight:600, color:T.color.text, fontFamily:T.font.body }}>{displayName}</div>
                      {TERPENE_PLAIN[name] && <div style={{ fontSize:"11.5px", color:T.color.textMuted, fontFamily:T.font.body }}>{TERPENE_PLAIN[name]}</div>}
                    </div>
                    <div style={{ position:"relative", width:"120px" }}>
                      <input
                        type="text" inputMode="decimal" value={form.terps[name]}
                        onChange={e=>setForm(f => ({ ...f, terps:{ ...f.terps, [name]: e.target.value } }))}
                        placeholder="optional" aria-label={`${displayName} percent, optional`}
                        style={{ ...FIELD_STYLE, padding:"10px 30px 10px 12px", fontSize:"14px" }}
                      />
                      <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color:T.color.textFaint, fontFamily:T.font.mono }}>%</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize:"11.5px", color:T.color.textFaint, fontFamily:T.font.body, lineHeight:1.5 }}>
                Percentages are optional — if the package doesn't list them, we'll rank the terpenes evenly.
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <Alert variant="warn">{error}</Alert>}

      <div style={{ display:"flex", gap:"8px" }}>
        <Btn onClick={onBack}>← Back</Btn>
        <Btn primary onClick={handleAnalyze} style={{ flex:1 }}>Analyze</Btn>
      </div>
    </div>
  );
}

// ─── HOME CARD ──────────────────────────────────────────────
function HomeCard({ icon, title, desc, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:T.color.surface, border:`1px solid ${T.color.borderLight}`, borderRadius:T.radius.lg,
      padding:"20px", cursor:"pointer", transition:"all 0.2s",
      boxShadow: T.shadow.sm, ...T.glass,
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(164,204,134,0.35)";e.currentTarget.style.background=T.color.white;e.currentTarget.style.boxShadow=T.shadow.hover;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.color.borderLight;e.currentTarget.style.background=T.color.surface;e.currentTarget.style.boxShadow=T.shadow.sm;}}
      onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
      onTouchStart={e=>e.currentTarget.style.opacity="0.8"}
      onTouchEnd={e=>e.currentTarget.style.opacity="1"}
    >
      <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
        <div style={{ width:"46px",height:"46px",borderRadius:"15px",background:T.color.greenLight,
          boxShadow:"inset 0 0 0 1px rgba(164,204,134,0.22)",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <Icon name={icon} size={20} color={T.color.green} />
        </div>
        <div style={{flex:1}}>
          <div style={{ fontFamily:T.font.display, fontSize:"16.5px", fontWeight:650, letterSpacing:"-0.01em", marginBottom:"2px", color:T.color.text }}>{title}</div>
          <div style={{ fontSize:"13px", color:T.color.textMuted, fontFamily:T.font.body }}>{desc}</div>
        </div>
        <div style={{ color:T.color.textFaint, fontSize:"18px" }}>›</div>
      </div>
    </div>
  );
}

// ─── RESULT CARD ────────────────────────────────────────────
function getOutcomeTitle(result) {
  const isPM = result.timing.includes("PM");
  const isAM = result.timing.includes("AM");
  const isBody = result.highType === "Body-heavy";
  const isHead = result.highType === "Head / Cerebral";
  if (isPM && isBody) return "Wind Down";
  if (isPM && isHead) return "Easygoing Evening";
  if (isPM) return "Evening Ease";
  if (isAM && isHead) return "Daytime Clarity";
  if (isAM && isBody) return "Focused Energy";
  if (isAM) return "Morning Balance";
  if (isBody) return "Calm & Grounded";
  if (isHead) return "Clear & Focused";
  return "Balanced & Grounded";
}

function ResultCard({ parsed, result, onSave, saved, onCompare, onCounter, compact }) {
  const cbdHero = result.isCBDForward;
  const timingMeta = result.timing.includes("PM") ? {icon:"moon",label:"Evening-Leaning",bg:T.color.pmBg,c:T.color.pm}
    : result.timing.includes("AM") ? {icon:"sun",label:"Daytime-Leaning",bg:T.color.amBg,c:T.color.am}
    : {icon:"scale",label:"Balanced Profile",bg:T.color.balBg,c:T.color.bal};
  const heroMeta = cbdHero ? {icon:"leaf",label:"CBD-Forward",bg:T.color.cbdBg,c:T.color.cbd} : timingMeta;
  const potencyColors = ["Very High","Extremely Strong"].includes(result.potency) ? {bg:T.color.warnBg,c:T.color.warnText} : {bg:T.color.surfaceAlt,c:T.color.text};

  return (
    <div style={{
      background:T.color.surface, borderRadius:T.radius.lg, padding: compact?"20px":"28px",
      border:`1px solid ${T.color.borderLight}`, boxShadow:T.shadow.sm, ...T.glass,
      borderTop: compact ? `1px solid ${T.color.borderLight}` : `3px solid ${heroMeta.c}`,
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: compact?"12px":"20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          {!compact && (
            <div style={{
              width:"44px", height:"44px", borderRadius:T.radius.md, flexShrink:0,
              background:heroMeta.bg, display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Icon name={heroMeta.icon} size={22} color={heroMeta.c} />
            </div>
          )}
          {compact && <Icon name={heroMeta.icon} size={20} color={heroMeta.c} />}
          <div>
            <h2 style={{ margin:0, fontSize: compact?"17px":"24px", fontFamily:T.font.display, fontWeight:750, letterSpacing:"-0.02em", color:T.color.text }}>
              {parsed.strainName || (cbdHero ? "CBD-Forward" : getOutcomeTitle(result))}
            </h2>
            {parsed.strainName && !compact && <div style={{ fontSize:"12px", color:T.color.textMuted, fontFamily:T.font.body, marginTop:"2px" }}>{heroMeta.label}</div>}
          </div>
        </div>
        {onSave && !compact && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"8px",marginTop:"2px"}}>
            <div style={{display:"flex",gap:"8px"}}>
              {onCompare && <Btn small onClick={onCompare}>Compare</Btn>}
              <Btn small onClick={onSave} disabled={saved}>{saved?"✓ Saved":"+ Save"}</Btn>
            </div>
            {onCounter && <Btn small primary onClick={onCounter}><Icon name="shoppingBag" size={12} color={T.color.textInv} />Take to Counter</Btn>}
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom: compact?"12px":"16px" }}>
        <Pill bg={timingMeta.bg} color={timingMeta.c}>{result.timing}</Pill>
        <Pill>{result.highType}</Pill>
        <Pill bg={potencyColors.bg} color={potencyColors.c}>{result.potency}{result.potency==="Microdose"?"":" Potency"}</Pill>
        {result.productLabel && result.productLabel !== "Flower" && <Pill bg={T.color.greenLight} color={T.color.green}>{result.productLabel}</Pill>}
        {cbdHero && <Pill bg={T.color.cbdBg} color={T.color.cbd}>CBD-Forward</Pill>}
      </div>

      {!compact && (
        <div style={{
          background:T.color.surfaceAlt, borderRadius:T.radius.md,
          padding:"14px 16px", marginBottom:"16px",
          display:"flex", flexDirection:"column", gap:"8px",
        }}>
          {/* Primary */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"12px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em" }}>Best for</span>
            <span style={{ fontSize:"14px", fontWeight:700, color:T.color.text, fontFamily:T.font.body }}>{result.timing}</span>
          </div>
          {/* Secondary */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"12px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em" }}>Effect profile</span>
            <span style={{ fontSize:"13px", fontWeight:500, color:T.color.textSec, fontFamily:T.font.body }}>{result.highType}</span>
          </div>
          {/* Tertiary */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"12px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em" }}>Match strength</span>
            <span style={{ fontSize:"12px", fontWeight:600, fontFamily:T.font.body,
              color: result.matchStrength==="High" ? T.color.green
                   : result.matchStrength==="Moderate" ? T.color.am
                   : result.matchStrength==="Low" ? "#e0a35c"
                   : T.color.textSec,
            }}>
              {result.matchStrength}
            </span>
          </div>
        </div>
      )}

      {!compact && <div style={{ height:"1px", background:T.color.borderLight, margin:"0 0 16px 0" }} />}

      {/* Stats — mg takes priority over % when available */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"10px", marginBottom: compact?"8px":"18px" }}>
        {parsed.thcMg!==null && <StatBox label="THC / Serving" value={parsed.thcMg} unit=" mg" type="thc" />}
        {parsed.cbdMg!==null && <StatBox label="CBD / Serving" value={parsed.cbdMg} unit=" mg" type="cbd" />}
        {parsed.thcMg===null && parsed.thc!==null && <StatBox label="THC" value={parsed.thc} unit="%" type="thc" />}
        {parsed.cbdMg===null && parsed.cbd!==null && <StatBox label="CBD" value={parsed.cbd} unit="%" type="cbd" />}
        {result.cbdThcRatio!==null && !result.ratioProfile && <StatBox label="CBD:THC" value={result.cbdThcRatio} unit="" type="ratio" />}
        {result.topTerps.map((t,i) => <StatBox key={i} label={t.displayName} value={t.noPct ? "✓" : t.value} unit={t.noPct ? "" : "%"} type="terpene" />)}
      </div>

      {!compact && <div style={{ height:"1px", background:T.color.borderLight, margin:"0 0 4px 0" }} />}

      <Spectrum value={result.spectrum} compact={compact} />

      {/* Ratio card */}
      {!compact && result.ratioProfile && <RatioCard ratioProfile={result.ratioProfile} />}

      {/* Use-case badges */}
      {!compact && result.useCases && result.useCases.length > 0 && <UseCaseBadges useCases={result.useCases} />}

      {/* Explanation */}
      {!compact && (
        <>
          <div style={{ height:"1px", background:T.color.borderLight, margin:"16px 0" }} />

          <div style={{ marginBottom:"12px" }}>
            <div style={{ fontSize:"11px", color:T.color.textMuted, letterSpacing:"0.08em", fontFamily:T.font.mono, textTransform:"uppercase", marginBottom:"6px" }}>What this means</div>
            <div style={{
              borderLeft:`4px solid ${T.color.greenMuted}`, borderRadius:T.radius.md, padding:"14px 16px",
              fontSize:"15px", lineHeight:1.7, color:T.color.text, fontFamily:T.font.body,
              background:T.color.surfaceAlt,
            }}>
              {result.explanation}
              <CitationMarks ids={ENTOURAGE_CITATIONS} />
            </div>
          </div>

          {(parsed.terpeneWarnings?.length > 0 || result.cautions.length > 0) && (
            <div style={{ height:"1px", background:T.color.borderLight, margin:"0 0 12px 0" }} />
          )}

          {parsed.terpeneWarnings && parsed.terpeneWarnings.length>0 && (
            <div style={{marginTop:"10px"}}><Alert variant="warn">{parsed.terpeneWarnings.join(" ")}</Alert></div>
          )}
          {result.cautions.length>0 && <div style={{marginTop:"10px"}}><Alert variant="warn">{result.cautions.join(" ")}</Alert></div>}

          <div style={{ marginTop:"14px", borderTop:`1px solid ${T.color.borderLight}`, paddingTop:"10px" }}>
            <div style={{ fontSize:"11px", color:T.color.textFaint, fontFamily:T.font.mono, letterSpacing:"0.05em", textAlign:"center", lineHeight:1.6 }}>
              Educational guide based on peer-reviewed research<CitationMarks ids={SAFETY_CITATIONS} /><br/>
              Not medical advice. Individual experience varies.{" "}
              <button
                type="button"
                onClick={() => window.__ssOpenSources && window.__ssOpenSources()}
                style={{
                  background:"none", border:"none", padding:"4px 6px",
                  color:T.color.green, fontFamily:T.font.mono, fontSize:"11px",
                  textDecoration:"underline", cursor:"pointer",
                  letterSpacing:"0.05em",
                }}
              >View sources</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── SAVED PRODUCT ROW ──────────────────────────────────────
function SavedRow({ entry, onDelete, onSelect, selected, onFeedback }) {
  const cbdRow = entry.result.isCBDForward;
  const timingIconName = cbdRow?"leaf":entry.result.timing.includes("PM")?"moon":entry.result.timing.includes("AM")?"sun":"scale";
  const timingIconColor = cbdRow?T.color.cbd:entry.result.timing.includes("PM")?T.color.pm:entry.result.timing.includes("AM")?T.color.am:T.color.bal;
  return (
    <div onClick={onSelect} style={{
      background:T.color.surface, borderRadius:"18px",
      padding:"18px 20px",
      border:`1.5px solid ${selected?"rgba(164,204,134,0.55)":T.color.borderLight}`,
      cursor: onSelect?"pointer":"default",
      transition:"all 0.15s",
      boxShadow: selected?T.shadow.hover:T.shadow.sm,
      ...T.glass,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
            <Icon name={timingIconName} size={16} color={timingIconColor} />
            <span style={{ fontFamily:T.font.display, fontSize:"16px", fontWeight:650, letterSpacing:"-0.01em", color:T.color.text }}>
              {entry.parsed.strainName || "Unnamed Product"}
            </span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"4px" }}>
            <Pill small>{entry.result.timing}</Pill>
            <Pill small>{entry.result.potency}</Pill>
            {entry.result.productLabel && <Pill small>{entry.result.productLabel}</Pill>}
            {cbdRow && <Pill small bg={T.color.cbdBg} color={T.color.cbd}>CBD</Pill>}
          </div>
          {entry.result.topTerps.length>0 && (
            <div style={{ fontSize:"12px", color:T.color.textSec, fontFamily:T.font.mono, marginTop:"6px" }}>
              {entry.result.topTerps.map(t => t.noPct ? t.displayName : `${t.displayName} ${t.value}%`).join("  ·  ")}
            </div>
          )}
        </div>
        {onDelete && (
          <button onClick={e=>{e.stopPropagation();onDelete(entry.id);}}
            style={{ width:"30px", height:"30px", borderRadius:T.radius.full, border:"none",
              background:T.color.surfaceAlt, cursor:"pointer", fontSize:"14px", color:T.color.textMuted,
              transition:"all 0.15s", flexShrink:0 }}>×</button>
        )}
      </div>
      {onFeedback && (
        <div style={{ display:"flex", gap:"4px", marginTop:"10px" }}>
          {[{key:"liked",icon:"thumbUp"},{key:"neutral",icon:"minus"},{key:"disliked",icon:"thumbDown"}].map(fb => (
            <button key={fb.key}
              onClick={e=>{e.stopPropagation();onFeedback(entry.id, fb.key===entry.feedback?null:fb.key);}}
              style={{
                flex:1, padding:"5px 0", borderRadius:T.radius.sm, border:"none", cursor:"pointer",
                fontSize:"14px", transition:"all 0.15s",
                background: entry.feedback===fb.key
                  ? (fb.key==="liked"?T.color.likedBg:fb.key==="disliked"?T.color.dislikedBg:T.color.neutralBg)
                  : T.color.surfaceAlt,
                opacity: entry.feedback && entry.feedback!==fb.key ? 0.45 : 1,
                display:"inline-flex", alignItems:"center", justifyContent:"center",
              }}><Icon name={fb.icon} size={14} color={entry.feedback===fb.key?(fb.key==="liked"?T.color.liked:fb.key==="disliked"?T.color.disliked:T.color.neutral):T.color.textMuted} /></button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QUICK COMPARE VIEW ─────────────────────────────────────
function QuickCompare({ entryA, saved, onPickB, onBack }) {
  const [selId, setSelId] = useState(null);
  const entryB = saved.find(e => e.id === selId);

  return (
    <div style={{animation:"ssReveal 0.35s ease-out"}}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"20px" }}>
        <Btn onClick={onBack}>← Back</Btn>
        <h2 style={{ margin:0, fontFamily:T.font.display, fontSize:"22px", fontWeight:750, letterSpacing:"-0.02em" }}>Quick Compare</h2>
      </div>

      {/* Product A — fixed */}
      <div style={{ marginBottom:"16px" }}>
        <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.textMuted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"6px" }}>Current Analysis</div>
        <ResultCard parsed={entryA.parsed} result={entryA.result} compact />
      </div>

      {/* Pick B */}
      {saved.length === 0 ? (
        <Alert variant="info">Save at least one other product to compare against.</Alert>
      ) : (
        <>
          <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.textMuted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"6px" }}>Select to Compare</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"20px" }}>
            {saved.filter(s => s.id !== entryA.id).map(s => (
              <SavedRow key={s.id} entry={s} onSelect={() => setSelId(s.id === selId ? null : s.id)} selected={s.id === selId} />
            ))}
          </div>
        </>
      )}

      {/* Side-by-side result */}
      {entryB && (
        <div style={{ animation:"ssReveal 0.35s ease-out" }}>
          <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.textMuted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"6px" }}>Comparison</div>
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px",
          }}>
            <div>
              <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.green, letterSpacing:"0.05em", marginBottom:"6px" }}>{entryA.parsed.strainName || "Product A"}</div>
              <ResultCard parsed={entryA.parsed} result={entryA.result} compact />
            </div>
            <div>
              <div style={{ fontSize:"11px", fontFamily:T.font.mono, color:T.color.green, letterSpacing:"0.05em", marginBottom:"6px" }}>{entryB.parsed.strainName || "Product B"}</div>
              <ResultCard parsed={entryB.parsed} result={entryB.result} compact />
            </div>
          </div>

          <div style={{
            background:T.color.surfaceAlt, borderRadius:T.radius.lg, padding:"18px",
            fontSize:"14px", lineHeight:1.6, color:T.color.textSec, fontFamily:T.font.body,
          }}>
            {generateComparison(
              entryA.result, entryB.result,
              entryA.parsed.strainName, entryB.parsed.strainName
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function StrainSense() {
  // Views: home | text | image | result | saved | compare | mood | moodResult | sources
  const [view, setView] = useState("home");
  const [sourceFocus, setSourceFocus] = useState(null);
  const [prevView, setPrevView] = useState("home");
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [saved, setSaved] = useState([]);
  const [justSaved, setJustSaved] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [tolerance, setTolerance] = useState(() => localStorage.getItem(TOLERANCE_KEY)||"regular");
  const [showCounter, setShowCounter] = useState(false);
  const [ageVerified, setAgeVerified] = useState(() => !!localStorage.getItem(AGE_GATE_KEY));
  const [disclaimerSeen, setDisclaimerSeen] = useState(() => !!localStorage.getItem(DISCLAIMER_KEY));
  const [scanNote, setScanNote] = useState(null);
  const [debugLog, setDebugLog] = useState([]);
  const fileRef = useRef();

  const confirmAge = () => {
    localStorage.setItem(AGE_GATE_KEY, "1");
    setAgeVerified(true);
  };

  const dismissDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "1");
    setDisclaimerSeen(true);
  };

  // Persist tolerance
  useEffect(() => { localStorage.setItem(TOLERANCE_KEY, tolerance); }, [tolerance]);

  // Expose a global hook so inline citation markers ([N]) route to Sources.
  useEffect(() => {
    window.__ssOpenSources = (id) => {
      setPrevView((curr) => (view === "sources" ? curr : view));
      setSourceFocus(id || null);
      setView("sources");
    };
    return () => { delete window.__ssOpenSources; };
  }, [view]);

  // Load saved on mount
  useEffect(() => {
    loadSaved().then(items => { setSaved(items); setStorageReady(true); });
  }, []);

  // Persist on change
  useEffect(() => {
    if (storageReady) saveToDisk(saved);
  }, [saved, storageReady]);

  const reset = () => {
    setView("home"); setImagePreview(null);
    setLoading(false); setError(null); setResult(null); setParsed(null);
    setJustSaved(false); setSelectedMood(null); setShowCounter(false);
    setDebugLog([]);
  };

  const updateFeedback = (id, feedback) => {
    setSaved(prev => prev.map(e => e.id===id ? {...e, feedback} : e));
  };

  const handleFormAnalyze = (p) => {
    setError(null);
    setParsed(p); setResult(classify(p, tolerance)); setView("result");
  };

  // Core image analysis — shared by both native Camera and web file input paths
  const analyzeImageBase64 = async (b64, mt) => {
    setError(null); setScanNote(null); setDebugLog([]); setLoading(true);
    const log = [];
    const addLog = (msg) => { log.push(msg); console.log("[scan]", msg); };

    try {
      // ── STEP 1: validate b64 ───────────────────────────────────
      addLog(`b64: type=${typeof b64}, length=${b64?.length ?? "N/A"}, mt=${mt}`);
      if (!b64 || typeof b64 !== "string") {
        setError("Image conversion failed before OCR — b64 is not a valid string.");
        setDebugLog(log); setLoading(false); return;
      }

      // ── STEP 2: proxy or direct ────────────────────────────────
      // Native builds bake VITE_API_URL in at build time; the web app
      // falls back to its own origin (the API routes live alongside it).
      const proxyBase = import.meta.env.VITE_API_URL
        || (!Capacitor.isNativePlatform() && typeof window !== "undefined" ? window.location.origin : null);
      addLog(`proxyBase=${proxyBase || "(none — direct)"}`);

      let extracted = "";
      let respStatus = null;

      if (proxyBase) {
        addLog(`Sending to /api/ocr, b64 size=${b64.length} chars (~${Math.round(b64.length * 0.75 / 1024)} KB)`);

        // ── STEP 3: fetch ──────────────────────────────────────
        const resp = await fetch(`${proxyBase}/api/ocr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: b64 }),
        });
        respStatus = resp.status;
        addLog(`Response status=${respStatus}`);

        // ── STEP 4: read body as text first ───────────────────
        const rawBody = await resp.text();
        addLog(`Raw body (first 300): ${rawBody.slice(0, 300)}`);

        // ── STEP 5: parse JSON safely ─────────────────────────
        let data = null;
        try {
          data = JSON.parse(rawBody);
          addLog(`provider=${data.provider}, keys: ${Object.keys(data).join(", ")}`);
          if (data.debug) addLog(`debug: bytes=${data.debug.byteSize}, textLen=${data.debug.textLength}`);
        } catch (jsonErr) {
          addLog(`JSON parse FAILED: ${jsonErr.message}`);
          setError(
            `Image uploaded, but server returned a non-JSON response (status ${respStatus}).\n\nRaw: ${rawBody.slice(0, 200)}`
          );
          setDebugLog(log); setLoading(false); return;
        }

        // ── STEP 6: extract text ───────────────────────────────
        addLog(`rawExtracted: "${String(data.text ?? "NULL").slice(0, 200)}"`);

        if (data.error && !data.text) {
          setError(`OCR error (status ${respStatus}): ${data.error}`);
          setDebugLog(log); setLoading(false); return;
        }

        extracted = typeof data.text === "string" ? data.text : "";
      } else {
        addLog("No proxyBase — cannot run OCR without server");
        setError("OCR requires a server connection. Please use the deployed app.");
        setDebugLog(log); setLoading(false); return;
      }

      setDebugLog(log);

      // ── STEP 7: empty text check ───────────────────────────────
      if (!extracted.trim() || extracted.trim().length < 5) {
        setError(`OCR returned no readable text (status: ${respStatus}). Image may be too blurry, dark, or in an unsupported format.`);
        setLoading(false); return;
      }

      // ── STEP 8: parse ──────────────────────────────────────────
      const p = parseInput(extracted);
      addLog(`Parsed: thc=${p.thc}, thcMg=${p.thcMg}, cbd=${p.cbd}, terps=${p.terpenes.length}`);
      console.log("[scan] parsed:", p);

      if (p.terpenes.length === 0 && p.thc === null && p.thcMg === null && p.cbd === null && p.cbdMg === null) {
        setError(
          `OCR returned text, but parsing found no cannabis values.\n\n` +
          `Extracted text:\n"${extracted.slice(0, 300)}"`
        );
        setLoading(false); return;
      }

      const hasTerps = p.terpenes.length >= 2;
      const hasThc = p.thc !== null || p.thcMg !== null;
      setScanNote(
        !hasTerps && !hasThc ? "Partial data extracted — best-fit estimate from limited signal." :
        (!hasTerps || !hasThc) ? "Likely profile based on partial label text." :
        null
      );

      setParsed(p); setResult(classify(p, tolerance)); setView("result");
    } catch (err) {
      log.push(`CATCH: ${err?.name}: ${err?.message}`);
      setDebugLog(log);
      console.error("[scan] error:", err);
      setError(`Error: ${err?.name ? `[${err.name}] ` : ""}${err?.message || "Image analysis failed. Try pasting values manually."}`);
    }
    setLoading(false);
  };

  // Native path — Capacitor Camera plugin (iOS + Android)
  const handleImageNative = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      const dataUrl = image.dataUrl;
      if (!dataUrl) { setError("Couldn't load image. Try again."); return; }
      const mt = dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
      const b64 = dataUrl.split(",")[1];
      setImagePreview(dataUrl);
      setView("image");
      await analyzeImageBase64(b64, mt);
    } catch (e) {
      // User cancelled — not an error
      if (e?.message && !e.message.includes("cancel") && !e.message.includes("No image")) {
        setError("Couldn't open photos. Please try again.");
      }
    }
  };

  // Web fallback — uses createObjectURL + canvas to handle HEIC on iOS Safari
  // Resizes to max 1200px and compresses to target ~500 KB before sending
  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setView("image");
    setLoading(true);
    setError(null);
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_SIDE = 1200;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > MAX_SIDE || h > MAX_SIDE) {
          if (w >= h) { h = Math.round(h * MAX_SIDE / w); w = MAX_SIDE; }
          else { w = Math.round(w * MAX_SIDE / h); h = MAX_SIDE; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.70);
        setImagePreview(dataUrl);
        const b64 = dataUrl.split(",")[1];
        await analyzeImageBase64(b64, "image/jpeg");
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError("Couldn't load this image. Try a different photo.");
        setLoading(false);
      };
      img.src = objectUrl;
    } catch(err) {
      setError("Error loading image: " + (err?.message || "unknown"));
      setLoading(false);
    }
  };

  const openImagePicker = () => {
    if (Capacitor.isNativePlatform()) {
      handleImageNative();
    } else {
      fileRef.current?.click();
    }
  };

  const saveProduct = () => {
    if (!parsed||!result) return;
    const entry = { id:uid(), parsed:{...parsed}, result:{...result}, savedAt:Date.now() };
    setSaved(prev=>[entry,...prev]); setJustSaved(true);
  };

  const deleteProduct = (id) => {
    setSaved(prev=>prev.filter(e=>e.id!==id));
  };

  const isHomeish = ["home","text","image","result","compare","mood","moodResult"].includes(view);

  if (!ageVerified) return <AgeGate onConfirm={confirmAge} />;

  return (
    <div style={{ minHeight:"100vh", background:T.color.bgDeep, fontFamily:T.font.body, color:T.color.text }}>
      <style>{`
        @keyframes ssReveal { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ssSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        html { color-scheme: dark; }
        /* Dark on every layer so no white edge can show, and no horizontal
           drift. The WebView's rubber-band bounce itself is disabled natively
           (iOS scrollView.bounces=false / Android overScrollMode=NEVER). */
        html, body { margin:0; width:100%; min-height:100%; background:#0a0c09; overscroll-behavior:none; overflow-x:hidden; }
        #root { min-height:100%; background:#0a0c09; padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); }
        textarea:focus, button:focus { outline:none; }
        textarea::placeholder { color:${T.color.textFaint}; }
        ::selection { background: rgba(164,204,134,0.30); }
        * { box-sizing:border-box; }
        input[type="file"] { display:none; }
      `}</style>

      {/* Fixed aurora atmosphere — glass surfaces frost this glow */}
      <div aria-hidden="true" style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background: `
          radial-gradient(70% 42% at 80% -5%, rgba(94,148,74,0.28) 0%, transparent 60%),
          radial-gradient(55% 36% at 8% 30%, rgba(196,164,58,0.10) 0%, transparent 65%),
          radial-gradient(80% 50% at 50% 112%, rgba(52,92,60,0.30) 0%, transparent 62%),
          linear-gradient(178deg, #0e120d 0%, #0a0c09 100%)`,
      }} />
      <div aria-hidden="true" style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background: "radial-gradient(42% 26% at 60% 24%, rgba(140,190,110,0.12) 0%, transparent 75%)",
      }} />

      <div style={{ maxWidth:"600px", margin:"0 auto", padding:"32px 20px 64px", position:"relative", zIndex:1 }}>

        {/* ── HEADER ── */}
        <div onClick={()=>reset()} style={{ textAlign:"center", marginBottom:"32px", cursor:"pointer" }}>
          <div style={{ marginBottom:"6px" }}><Icon name="leaf" size={32} color={T.color.green} /></div>
          <h1 style={{
            fontFamily:T.font.display, fontSize:"30px", fontWeight:750,
            margin:"0 0 3px 0", letterSpacing:"-0.03em", color:T.color.text,
          }}>Strain Sense</h1>
          <p style={{ fontSize:"13px", color:T.color.textMuted, margin:0, fontFamily:T.font.body, fontWeight:400 }}>
            Make sense of your experience.
          </p>
        </div>

        {/* ── DISCLAIMER ── */}
        {!disclaimerSeen && (
          <div style={{
            background:T.color.surfaceAlt, border:`1px solid ${T.color.borderLight}`,
            borderRadius:T.radius.lg, padding:"14px 40px 14px 16px",
            marginBottom:"20px", fontSize:"13px", color:T.color.textSec,
            lineHeight:1.6, position:"relative",
            borderLeft:`3px solid ${T.color.greenMuted}`, ...T.glass,
          }}>
            <strong style={{ color:T.color.text }}>Educational use only.</strong>{" "}
            Strain Sense provides general information based on peer-reviewed terpene
            and cannabis research. It is not medical advice, diagnosis, or treatment.
            Effects vary by individual and product. Always consult a licensed
            healthcare provider, especially if you are pregnant, nursing, taking
            medication, or have a medical condition.{" "}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); window.__ssOpenSources && window.__ssOpenSources(); }}
              style={{
                background:"none", border:"none", padding:0,
                color:T.color.green, fontWeight:500, cursor:"pointer",
                fontSize:"13px", textDecoration:"underline",
                fontFamily:"inherit",
              }}
            >View sources →</button>
            <button
              onClick={dismissDisclaimer}
              style={{
                position:"absolute", top:"10px", right:"12px",
                background:"none", border:"none", cursor:"pointer",
                fontSize:"18px", color:T.color.textMuted, lineHeight:1, fontWeight:300,
                minWidth:"24px", minHeight:"24px",
              }}
              aria-label="Dismiss"
            >×</button>
          </div>
        )}

        {/* ── NAV ── */}
        {saved.length>0 && (
          <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"24px" }}>
            {[
              {key:"home",label:"Analyze",match:["home","text","image","result","compare","mood","moodResult"]},
              {key:"saved",label:`Saved (${saved.length})`},
            ].map(tab => {
              const active = tab.match ? tab.match.includes(view) : view===tab.key;
              return (
                <button key={tab.key}
                  onClick={()=>{if(tab.key==="home") reset(); else setView(tab.key);}}
                  style={{
                    padding:"7px 18px", borderRadius:T.radius.pill,
                    border:`1px solid ${active?T.color.greenMuted:T.color.borderLight}`,
                    background:active?T.color.greenLight:T.color.surfaceAlt,
                    color:active?T.color.green:T.color.textMuted,
                    fontSize:"12px", fontFamily:T.font.mono, fontWeight:500,
                    cursor:"pointer", transition:"all 0.15s",
                  }}>{tab.label}</button>
              );
            })}
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* HOME                                            */}
        {/* ════════════════════════════════════════════════ */}
        {view==="home" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px", animation:"ssReveal 0.35s ease-out" }}>
            <HomeCard icon="camera" title="Scan Product"
              desc="Photo of a label, menu, or terpene panel"
              onClick={()=>{ setView("image"); setTimeout(openImagePicker, 100); }} />
            <HomeCard icon="fileText" title="Enter Product Profile"
              desc="Paste the label text or tap in the details"
              onClick={()=>setView("text")} />
            <HomeCard icon="compass" title="How Do You Want to Feel?"
              desc="Pick a mood — we'll tell you what to look for"
              onClick={()=>setView("mood")} />
            <div style={{ background:T.color.surface, borderRadius:T.radius.lg, padding:"20px", border:`1px solid ${T.color.borderLight}`, boxShadow:T.shadow.sm, ...T.glass }}>
              <ToleranceSelector value={tolerance} onChange={setTolerance} />
            </div>
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* PRODUCT ENTRY (paste-first guided form)          */}
        {/* ════════════════════════════════════════════════ */}
        {view==="text" && (
          <ProductForm onBack={reset} onAnalyze={handleFormAnalyze} />
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* IMAGE INPUT (EXPANDED)                          */}
        {/* ════════════════════════════════════════════════ */}
        {view==="image" && !result && (
          <div style={{animation:"ssReveal 0.3s ease-out"}}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} />

            {imagePreview && (
              <div style={{borderRadius:T.radius.lg, overflow:"hidden", marginBottom:"14px", border:`1px solid ${T.color.border}`}}>
                <img src={imagePreview} alt="Label" style={{width:"100%",display:"block"}} />
              </div>
            )}

            {loading && (
              <div style={{textAlign:"center",padding:"36px",color:T.color.textMuted}}>
                <div style={{marginBottom:"10px",animation:"ssSpin 1.2s linear infinite"}}><Icon name="leaf" size={28} color={T.color.greenMuted} /></div>
                <div style={{fontFamily:T.font.mono,fontSize:"13px"}}>Analyzing image...</div>
                <div style={{fontFamily:T.font.body,fontSize:"12px",color:T.color.textFaint,marginTop:"6px"}}>Reading THC, CBD, terpenes, ratios, and dosing info</div>
              </div>
            )}

            {!loading && !imagePreview && (
              <>
                <div onClick={openImagePicker} style={{
                  border:`2px dashed ${T.color.border}`, borderRadius:T.radius.lg, padding:"44px 20px",
                  textAlign:"center", cursor:"pointer", background:T.color.surface, transition:"all 0.2s",
                  ...T.glass,
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.color.green;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.color.border;}}
                >
                  <div style={{marginBottom:"10px"}}><Icon name="camera" size={36} color={T.color.greenMuted} /></div>
                  <div style={{fontSize:"14px",color:T.color.textSec,fontWeight:500,marginBottom:"4px"}}>Tap to upload a photo</div>
                  <div style={{fontSize:"12px",color:T.color.textMuted}}>Flower jars · Gummy packages · Tincture bottles · Menu screenshots</div>
                </div>

                {/* Tip card */}
                <div style={{
                  background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"14px 16px", marginTop:"12px",
                  fontSize:"12px", color:T.color.textMuted, lineHeight:1.5, fontFamily:T.font.body,
                }}>
                  <strong style={{color:T.color.textSec}}>Tips for best results:</strong>
                  <div style={{marginTop:"4px"}}>
                    Works with flower jars, vape carts, gummy/edible packaging, tincture bottles, capsule labels, COA sheets, and dispensary menu screenshots. Make sure THC/CBD values, mg dosing, and terpene info are readable.
                  </div>
                </div>
              </>
            )}

<div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
              <Btn onClick={reset}>← Back</Btn>
              {imagePreview && !loading && <Btn onClick={openImagePicker} style={{flex:1}}>Try different photo</Btn>}
            </div>
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* MOOD SELECTOR                                   */}
        {/* ════════════════════════════════════════════════ */}
        {view==="mood" && (
          <div style={{animation:"ssReveal 0.3s ease-out"}}>
            <h2 style={{ fontFamily:T.font.display, fontSize:"22px", fontWeight:750, letterSpacing:"-0.02em", margin:"0 0 4px 0" }}>How do you want to feel?</h2>
            <p style={{ fontSize:"13px", color:T.color.textMuted, margin:"0 0 18px 0" }}>Pick a mood and we'll tell you what terpenes to look for.</p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
              {MOOD_PRESETS.map(m => (
                <div key={m.id} onClick={()=>{ setSelectedMood(m.id); setView("moodResult"); }} style={{
                  background:T.color.surface, borderRadius:T.radius.lg, padding:"16px",
                  border:`1.5px solid ${T.color.borderLight}`,
                  cursor:"pointer", transition:"all 0.12s",
                  boxShadow:T.shadow.sm, ...T.glass,
                }}
                onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                onTouchStart={e=>e.currentTarget.style.opacity="0.75"}
                onTouchEnd={e=>e.currentTarget.style.opacity="1"}
                >
                  <div style={{marginBottom:"8px"}}><Icon name={m.icon} size={22} color={T.color.green} /></div>
                  <div style={{fontFamily:T.font.display,fontSize:"15px",fontWeight:650,letterSpacing:"-0.01em",color:T.color.text,marginBottom:"2px"}}>{m.label}</div>
                  <div style={{fontSize:"12px",color:T.color.textMuted}}>{m.desc}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:"8px"}}>
              <Btn onClick={reset}>← Back</Btn>
            </div>
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* MOOD RESULT                                     */}
        {/* ════════════════════════════════════════════════ */}
        {view==="moodResult" && selectedMood && (() => {
          const mood = MOOD_PRESETS.find(m=>m.id===selectedMood);
          if (!mood) return null;
          return (
            <div style={{animation:"ssReveal 0.35s ease-out"}}>
              <div style={{
                background:T.color.surface, borderRadius:T.radius.lg, padding:"28px",
                border:`1px solid ${T.color.borderLight}`, boxShadow:T.shadow.sm, ...T.glass,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"18px"}}>
                  <Icon name={mood.icon} size={28} color={T.color.green} />
                  <div>
                    <h2 style={{margin:0,fontFamily:T.font.display,fontSize:"22px",fontWeight:750,letterSpacing:"-0.02em"}}>{mood.label}</h2>
                    <div style={{fontSize:"13px",color:T.color.textSec,marginTop:"2px"}}>{mood.desc}</div>
                  </div>
                </div>

                <div style={{fontSize:"11px",fontFamily:T.font.mono,color:T.color.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"8px"}}>Look for these terpenes</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"18px"}}>
                  {mood.terpenes.map(t => {
                    const display = DISPLAY[t] || t;
                    const note = NOTES[t];
                    const cites = TERPENE_CITATIONS[t] || [];
                    return (
                      <div key={t} style={{
                        background:T.color.greenLight, borderRadius:T.radius.lg, padding:"14px 16px",
                        flex:"1 1 auto", minWidth:"140px",
                      }}>
                        <div style={{fontFamily:T.font.display,fontSize:"15px",fontWeight:650,letterSpacing:"-0.01em",color:T.color.green,marginBottom:"2px"}}>
                          {display}<CitationMarks ids={cites} />
                        </div>
                        {note && <div style={{fontSize:"12px",color:T.color.textMuted,lineHeight:1.4}}>{note}</div>}
                      </div>
                    );
                  })}
                </div>

                <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"16px"}}>
                  <Pill bg={mood.timing.includes("PM")?T.color.pmBg:mood.timing.includes("AM")?T.color.amBg:T.color.balBg}
                    color={mood.timing.includes("PM")?T.color.pm:mood.timing.includes("AM")?T.color.am:T.color.bal}>
                    {mood.timing}
                  </Pill>
                  <Pill>{mood.highType}</Pill>
                  <Pill bg={T.color.amBg} color={T.color.am}>THC: {mood.thcRange}</Pill>
                </div>

                {mood.note && (
                  <div style={{
                    background:T.color.surfaceAlt, borderRadius:T.radius.lg, padding:"16px",
                    fontSize:"14px", lineHeight:1.65, color:T.color.textSec, fontFamily:T.font.body,
                    marginTop:"4px",
                  }}>
                    {mood.note}
                    <CitationMarks ids={ENTOURAGE_CITATIONS} />
                  </div>
                )}

                {mood.extra && (
                  <div style={{
                    background:T.color.cbdBg, borderRadius:T.radius.lg, padding:"16px",
                    fontSize:"13px", lineHeight:1.6, color:T.color.cbd, fontFamily:T.font.body,
                    marginTop:"12px", display:"flex", gap:"10px", alignItems:"flex-start",
                  }}>
                    <Icon name="info" size={16} color={T.color.cbd} style={{ flexShrink:0, marginTop:"1px" }} />
                    <span>{mood.extra}</span>
                  </div>
                )}

                {/* Match against saved */}
                {saved.length > 0 && (() => {
                  const matches = saved.filter(s => {
                    const sTerps = s.result.topTerps.map(t => t.name);
                    return mood.terpenes.some(mt => sTerps.includes(mt));
                  });
                  if (matches.length === 0) return null;
                  return (
                    <div style={{marginTop:"16px"}}>
                      <div style={{fontSize:"11px",fontFamily:T.font.mono,color:T.color.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"8px"}}>From your saved products</div>
                      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                        {matches.slice(0,3).map(m => (
                          <SavedRow key={m.id} entry={m} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{display:"flex",gap:"8px",marginTop:"16px",justifyContent:"center"}}>
                <Btn onClick={()=>setView("mood")}>← Pick Different Mood</Btn>
                <Btn onClick={reset}><Icon name="leaf" size={13} />Home</Btn>
              </div>
            </div>
          );
        })()}


        {/* ════════════════════════════════════════════════ */}
        {/* ERROR                                           */}
        {/* ════════════════════════════════════════════════ */}
        {error && <div style={{marginTop:"14px"}}><Alert variant="warn">{error}</Alert></div>}


        {/* ════════════════════════════════════════════════ */}
        {/* RESULT                                          */}
        {/* ════════════════════════════════════════════════ */}
        {view==="result" && result && parsed && (
          <div style={{animation:"ssReveal 0.35s ease-out"}}>
            {scanNote && (
              <div style={{
                background:T.color.amBg, borderRadius:T.radius.md, padding:"10px 14px",
                fontSize:"13px", color:T.color.am, fontFamily:T.font.body, marginBottom:"12px",
                display:"flex", gap:"8px", alignItems:"center",
              }}>
                <Icon name="info" size={14} color={T.color.am} />
                {scanNote}
              </div>
            )}
            <ResultCard
              parsed={parsed} result={result}
              onSave={saveProduct} saved={justSaved}
              onCompare={saved.length>0 ? ()=>setView("compare") : null}
              onCounter={()=>setShowCounter(true)}
            />
            <div style={{display:"flex",gap:"8px",justifyContent:"center",marginTop:"20px"}}>
              <Btn onClick={reset}><Icon name="leaf" size={13} />Analyze Another</Btn>
            </div>
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* COMPARE (from result)                           */}
        {/* ════════════════════════════════════════════════ */}
        {view==="compare" && parsed && result && (
          <QuickCompare
            entryA={{id:"current",parsed,result}}
            saved={saved}
            onBack={()=>setView("result")}
          />
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* SAVED PRODUCTS                                  */}
        {/* ════════════════════════════════════════════════ */}
        {view==="saved" && (
          <div style={{animation:"ssReveal 0.35s ease-out"}}>
            <h2 style={{ fontFamily:T.font.display, fontSize:"22px", fontWeight:750, letterSpacing:"-0.02em", margin:"0 0 16px 0" }}>Saved Products</h2>

            {saved.length===0 ? (
              <div style={{textAlign:"center",padding:"40px 20px",color:T.color.textMuted}}>
                <div style={{marginBottom:"10px"}}><Icon name="fileText" size={28} color={T.color.textMuted} /></div>
                <div style={{fontSize:"14px"}}>No products saved yet.</div>
                <div style={{fontSize:"12px",marginTop:"4px"}}>Analyze a product and tap "Save" to keep it here.</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {saved.map(e => (
                  <SavedRow key={e.id} entry={e} onDelete={deleteProduct} onFeedback={updateFeedback} />
                ))}
              </div>
            )}
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* SOURCES & CITATIONS                             */}
        {/* ════════════════════════════════════════════════ */}
        {view==="sources" && (
          <SourcesScreen
            focusId={sourceFocus}
            onBack={() => {
              setSourceFocus(null);
              setView(prevView || "home");
            }}
          />
        )}


        {/* ── PERSISTENT FOOTER LINK (Sources & Citations) ── */}
        {view !== "sources" && (
          <div style={{
            marginTop: "32px", paddingTop: "16px",
            borderTop: `1px solid ${T.color.borderLight}`,
            textAlign: "center",
          }}>
            <button
              type="button"
              onClick={() => { setPrevView(view); setSourceFocus(null); setView("sources"); }}
              style={{
                background: "none", border: "none", padding: "8px 12px",
                color: T.color.textMuted, fontFamily: T.font.mono,
                fontSize: "11px", letterSpacing: "0.05em",
                cursor: "pointer", textDecoration: "underline",
                minHeight: "44px",
              }}
              aria-label="Open Sources and Citations screen"
            >
              Sources &amp; Citations
            </button>
          </div>
        )}

      </div>

      {showCounter && parsed && result && (
        <CounterCard parsed={parsed} result={result} onClose={()=>setShowCounter(false)} />
      )}
    </div>
  );
}
