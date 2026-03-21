import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// STRAIN SENSE v2 — Make sense of what you're smoking.
// ═══════════════════════════════════════════════════════════

// ─── DESIGN TOKENS ──────────────────────────────────────────
const T = {
  color: {
    bg:           "#f3f1ea",
    bgDeep:       "#eae7dc",
    surface:      "#faf9f5",
    surfaceAlt:   "#f0ede4",
    white:        "#ffffff",
    border:       "#d8d4c6",
    borderLight:  "#e4e0d4",

    text:         "#2c2c24",
    textSec:      "#5c5c50",
    textMuted:    "#908e82",
    textFaint:    "#b4b2a6",
    textInv:      "#faf9f5",

    green:        "#4d6b3d",
    greenDeep:    "#3b5530",
    greenLight:   "#e6efe0",
    greenMuted:   "#8aaa76",

    am:           "#c49f1a",
    amBg:         "#fdf7e2",
    pm:           "#6e70a8",
    pmBg:         "#ededf6",
    bal:          "#6d8060",
    balBg:        "#e8ede5",

    warn:         "#b54e3a",
    warnBg:       "#f8e8e2",
    warnText:     "#904030",

    liked:        "#4d6b3d",
    likedBg:      "#e6efe0",
    neutral:      "#908e82",
    neutralBg:    "#f0ede4",
    disliked:     "#b54e3a",
    dislikedBg:   "#f8e8e2",
  },
  font: {
    display:  "'DM Serif Display', Georgia, serif",
    body:     "'Libre Franklin', 'Helvetica Neue', sans-serif",
    mono:     "'IBM Plex Mono', monospace",
  },
  radius: { sm: "8px", md: "12px", lg: "16px", pill: "24px", full: "9999px" },
  shadow: {
    sm: "0 1px 4px rgba(44,44,36,0.06)",
    md: "0 3px 14px rgba(44,44,36,0.08)",
    hover: "0 4px 18px rgba(77,107,61,0.14)",
  },
};

const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;500&family=Libre+Franklin:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap";

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

function norm(n) { return n.toLowerCase().replace(/[^a-z]/g,""); }

function parseInput(text) {
  const r = { thc:null, cbd:null, terpenes:[], productType:null, totalTerpenes:null, strainName:null, terpeneWarnings:[] };
  const lines = text.replace(/\|/g,"\n").replace(/,(?=\s*[a-zA-Z])/g,"\n").split("\n");
  for (const line of lines) {
    const c = line.trim();
    if (!c) continue;
    const thc = c.match(/thc[:\s]*(\d+\.?\d*)%?/i);
    if (thc) { r.thc = parseFloat(thc[1]); continue; }
    const cbd = c.match(/cbd[:\s]*(\d+\.?\d*)%?/i);
    if (cbd) { r.cbd = parseFloat(cbd[1]); continue; }
    const tot = c.match(/total\s*terpenes?[:\s]*(\d+\.?\d*)%?/i);
    if (tot) { r.totalTerpenes = parseFloat(tot[1]); continue; }
    const typ = c.match(/\b(flower|vape|cart|cartridge|pre.?roll|edible|concentrate|dab|wax|shatter|rosin|live resin)\b/i);
    if (typ) { r.productType = typ[1].toLowerCase(); continue; }
    const strain = c.match(/^(?:strain|name)[:\s]+(.+)$/i);
    if (strain) { r.strainName = strain[1].trim(); continue; }
    const tp = c.match(/^([a-zA-Zα-ωΑ-Ω\- ]+)[:\s]+(\d+\.?\d*)%?$/);
    if (tp) {
      const name = norm(tp[1]); const val = parseFloat(tp[2]);
      if (val > 0 && !name.includes("thc") && !name.includes("cbd") && !name.includes("total")) {
        r.terpenes.push({ name, value:val, displayName: DISPLAY[name]||tp[1].trim() });
      }
    }
  }
  if (!r.productType && r.thc) r.productType = r.thc > 50 ? "vape" : "flower";
  r.terpenes.sort((a,b) => b.value - a.value);
  for (const t of r.terpenes) {
    if (t.value > 2) r.terpeneWarnings.push(`${t.displayName} at ${t.value}% seems unusually high — double-check this value.`);
  }
  if (r.totalTerpenes !== null && r.totalTerpenes > 5) {
    r.terpeneWarnings.push(`Total terpenes at ${r.totalTerpenes}% is very high — may indicate a measurement error or added terpenes.`);
  }
  return r;
}

function classify(p, tolerance = "regular") {
  const { thc, cbd, terpenes, productType } = p;
  const isVape = ["vape","cart","cartridge","concentrate","dab","wax","shatter","rosin","live resin"].includes(productType);
  let potency;
  if (isVape) { potency = thc===null?"Unknown":thc<70?"Lower-end":thc<=80?"High":thc<=85?"Very High":"Extremely Strong"; }
  else { potency = thc===null?"Unknown":thc<15?"Low":thc<=20?"Moderate":thc<=25?"High":"Very High"; }
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
  const cautions = [];
  if (tolerance === "new") {
    if (thc!==null && ((isVape&&thc>70)||(!isVape&&thc>18))) cautions.push("For new or occasional users, this THC level may feel very intense — start with one small dose and wait.");
    if (thc!==null && ((isVape&&thc>80)||(!isVape&&thc>22))) cautions.push("This potency is not recommended without experienced guidance.");
  } else if (tolerance === "daily") {
    if (thc!==null && ((isVape&&thc>92)||(!isVape&&thc>32))) cautions.push("Exceptionally high THC — even for daily users, starting lower is wise.");
  } else {
    if (thc!==null && ((isVape&&thc>85)||(!isVape&&thc>25))) cautions.push("High THC may override terpene nuance — start low, go slow.");
    if (thc!==null && ((isVape&&thc>80)||(!isVape&&thc>22))) cautions.push("Beginners should approach with extra caution at this potency.");
  }
  const cbdThcRatio = (thc!==null && thc>0 && cbd!==null && cbd>0) ? Math.round((cbd/thc)*100)/100 : null;
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
  if (thc!==null) {
    explanation += potency==="Low"||potency==="Moderate"
      ? "THC is moderate, so effects may feel manageable."
      : "THC is elevated — intensity may be significant regardless of terpene profile.";
  }
  if (cbdThcRatio!==null && cbdThcRatio>=0.1) explanation += ` CBD at ${cbd}% may soften intensity and add body comfort.`;
  return { potency, timing, highType, spectrum, cautions, explanation, topTerps, isVape, productType, cbdThcRatio };
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

  return parts.join(" ");
}

// ─── MOOD PRESETS ───────────────────────────────────────────
const MOOD_PRESETS = [
  { id:"relax", emoji:"😌", label:"Relaxed & Calm", desc:"Wind down, melt tension", terpenes:["linalool","myrcene","nerolidol"], timing:"PM / Evening", highType:"Body-heavy" },
  { id:"energy", emoji:"⚡", label:"Energized & Focused", desc:"Daytime clarity, get things done", terpenes:["limonene","pinene","terpinolene"], timing:"AM / Daytime", highType:"Head / Cerebral" },
  { id:"social", emoji:"🎉", label:"Social & Uplifted", desc:"Good vibes, conversation", terpenes:["limonene","terpinolene","ocimene"], timing:"AM / Daytime", highType:"Head / Cerebral" },
  { id:"sleep", emoji:"😴", label:"Sleep & Recovery", desc:"Heavy body, full shutdown", terpenes:["myrcene","linalool","nerolidol"], timing:"PM / Evening", highType:"Body-heavy" },
  { id:"balanced", emoji:"🧘", label:"Balanced & Grounded", desc:"Even-keel, centered", terpenes:["caryophyllene","humulene","bisabolol"], timing:"Balanced", highType:"Mixed head + body" },
  { id:"creative", emoji:"🎨", label:"Creative & Exploratory", desc:"Open-minded, playful", terpenes:["terpinolene","limonene","pinene"], timing:"AM / Daytime", highType:"Head / Cerebral" },
];

// ─── PERSISTENT STORAGE ─────────────────────────────────────
const STORAGE_KEY = "strain-sense-saved";
const TOLERANCE_KEY = "strain-sense-tolerance";

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
      fontSize: small ? "11px" : "12.5px",
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

function StatBox({ label, value, unit }) {
  return (
    <div style={{
      background: T.color.surfaceAlt, borderRadius: T.radius.md,
      padding: "14px 10px", textAlign:"center", minWidth:"90px", flex:"1 1 90px",
    }}>
      <div style={{ fontSize:"10px", color:T.color.textMuted, letterSpacing:"0.08em", fontFamily:T.font.mono, textTransform:"uppercase", marginBottom:"3px" }}>{label}</div>
      <div style={{ fontSize:"22px", fontWeight:700, color:T.color.text, fontFamily:T.font.display }}>{value}<span style={{fontSize:"14px",fontWeight:400}}>{unit||""}</span></div>
    </div>
  );
}

function Spectrum({ value, compact }) {
  const pct = ((value+1)/2)*100;
  return (
    <div style={{ margin: compact?"10px 0":"18px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", letterSpacing:"0.07em", color:T.color.textMuted, marginBottom:"5px", fontFamily:T.font.mono }}>
        <span>☀️ DAYTIME</span><span>BALANCED</span><span>EVENING 🌙</span>
      </div>
      <div style={{ position:"relative", height: compact?"8px":"10px", borderRadius:"5px",
        background:`linear-gradient(90deg, #dbb934 0%, #b8b490 50%, #7072a8 100%)` }}>
        <div style={{
          position:"absolute", top: compact?"-2px":"-3px", left:`calc(${pct}% - 8px)`,
          width: compact?"12px":"16px", height: compact?"12px":"16px", borderRadius:T.radius.full,
          background:T.color.text, border:`2px solid ${T.color.bg}`,
          boxShadow:T.shadow.sm, transition:"left 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}/>
      </div>
    </div>
  );
}

function Alert({ variant, children }) {
  const s = variant==="warn" ? {bg:T.color.warnBg,c:T.color.warnText,icon:"⚠️"}
    : variant==="info" ? {bg:T.color.greenLight,c:T.color.green,icon:"💡"}
    : {bg:T.color.surfaceAlt,c:T.color.textMuted,icon:""};
  return (
    <div style={{ background:s.bg, borderRadius:T.radius.md, padding:"14px 16px",
      fontSize:"13px", color:s.c, lineHeight:1.55, fontFamily:T.font.body }}>
      {s.icon && <span style={{marginRight:"5px"}}>{s.icon}</span>}{children}
    </div>
  );
}

function Btn({ children, primary, small, onClick, disabled, style: sx }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "7px 16px" : "11px 20px",
      borderRadius: small ? T.radius.pill : T.radius.md,
      border: primary ? "none" : `1px solid ${disabled ? T.color.borderLight : T.color.border}`,
      background: primary
        ? `linear-gradient(135deg, ${T.color.green}, ${T.color.greenDeep})`
        : disabled ? T.color.surfaceAlt : T.color.white,
      color: primary ? T.color.textInv : disabled ? T.color.textMuted : T.color.textSec,
      cursor: disabled ? "default" : "pointer",
      fontSize: small ? "12px" : "13.5px",
      fontWeight: primary ? 500 : 400,
      fontFamily: primary ? T.font.display : T.font.mono,
      transition: "all 0.15s",
      ...sx,
    }}>{children}</button>
  );
}

// ─── TOLERANCE SELECTOR ─────────────────────────────────────
function ToleranceSelector({ value, onChange }) {
  const levels = [
    { key:"new", label:"New / Occasional" },
    { key:"regular", label:"Regular" },
    { key:"daily", label:"Daily" },
  ];
  return (
    <div>
      <div style={{ fontSize:"10px", color:T.color.textMuted, letterSpacing:"0.08em", fontFamily:T.font.mono, textTransform:"uppercase", marginBottom:"6px" }}>Experience Level</div>
      <div style={{ display:"flex", gap:"4px" }}>
        {levels.map(l => (
          <button key={l.key} onClick={()=>onChange(l.key)} style={{
            flex:1, padding:"7px 6px", borderRadius:T.radius.sm,
            border:`1px solid ${value===l.key?T.color.green:T.color.border}`,
            background:value===l.key?T.color.greenLight:T.color.white,
            color:value===l.key?T.color.green:T.color.textMuted,
            fontSize:"11.5px", fontFamily:T.font.mono, fontWeight:value===l.key?500:400,
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

function CounterCard({ parsed, result, onClose }) {
  const timingMeta = result.timing.includes("PM")
    ? {icon:"🌙", text:"Best for evening or nighttime"}
    : result.timing.includes("AM")
    ? {icon:"☀️", text:"Good for daytime use"}
    : {icon:"⚖️", text:"Flexible — morning or evening"};
  const productLabel = result.isVape ? "vape" : (parsed.productType||"flower");
  const oneLiner = `${result.timing} · ${result.highType} · ${result.potency} potency ${productLabel}${result.topTerps.length>0?` · ${result.topTerps[0].displayName}-forward`:""}`;

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(44,44,36,0.55)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:"20px",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.color.white, borderRadius:T.radius.lg,
        padding:"32px 28px", maxWidth:"400px", width:"100%",
        boxShadow:"0 8px 40px rgba(44,44,36,0.22)",
      }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ fontSize:"36px", marginBottom:"6px" }}>{timingMeta.icon}</div>
          <h2 style={{ fontFamily:T.font.display, fontSize:"24px", margin:"0 0 4px 0", color:T.color.text }}>
            {parsed.strainName || "This Product"}
          </h2>
          <div style={{ fontSize:"13px", color:T.color.textMuted, fontFamily:T.font.body }}>{timingMeta.text}</div>
        </div>

        {/* Key numbers */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
          {parsed.thc!==null && (
            <div style={{ background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"12px", textAlign:"center", flex:"0 0 auto", minWidth:"80px" }}>
              <div style={{ fontSize:"10px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"2px" }}>THC</div>
              <div style={{ fontSize:"22px", fontWeight:700, fontFamily:T.font.display }}>{parsed.thc}%</div>
            </div>
          )}
          {parsed.cbd!==null && parsed.cbd>0 && (
            <div style={{ background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"12px", textAlign:"center", flex:"0 0 auto", minWidth:"70px" }}>
              <div style={{ fontSize:"10px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"2px" }}>CBD</div>
              <div style={{ fontSize:"22px", fontWeight:700, fontFamily:T.font.display }}>{parsed.cbd}%</div>
            </div>
          )}
          <div style={{ background:T.color.greenLight, borderRadius:T.radius.md, padding:"12px", textAlign:"center", flex:1 }}>
            <div style={{ fontSize:"10px", color:T.color.green, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"2px" }}>Effect</div>
            <div style={{ fontSize:"16px", fontWeight:600, color:T.color.green, fontFamily:T.font.display, lineHeight:1.2 }}>{result.highType}</div>
          </div>
        </div>

        {/* Top terpenes */}
        {result.topTerps.length>0 && (
          <div style={{ marginBottom:"20px" }}>
            <div style={{ fontSize:"10px", color:T.color.textMuted, fontFamily:T.font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>Top Terpenes</div>
            {result.topTerps.map((t,i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"9px 0",
                borderBottom: i<result.topTerps.length-1 ? `1px solid ${T.color.borderLight}` : "none",
              }}>
                <span style={{ fontFamily:T.font.body, fontSize:"14.5px", fontWeight:500, color:T.color.text }}>{t.displayName}</span>
                <span style={{ fontFamily:T.font.mono, fontSize:"12px", color:T.color.textMuted }}>{TERPENE_PLAIN[t.name]||""}</span>
              </div>
            ))}
          </div>
        )}

        {/* One-liner summary */}
        <div style={{
          background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"14px 16px",
          fontSize:"13px", lineHeight:1.55, color:T.color.textSec, fontFamily:T.font.mono,
          marginBottom:"20px", letterSpacing:"0.01em",
        }}>{oneLiner}</div>

        <Btn onClick={onClose} style={{ width:"100%", textAlign:"center" }}>Close</Btn>
      </div>
    </div>
  );
}

// ─── HOME CARD ──────────────────────────────────────────────
function HomeCard({ emoji, title, desc, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:T.color.white, border:`1px solid ${T.color.border}`, borderRadius:T.radius.lg,
      padding:"20px", cursor:"pointer", transition:"all 0.2s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.color.green;e.currentTarget.style.boxShadow=T.shadow.hover;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.color.border;e.currentTarget.style.boxShadow="none";}}
    >
      <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
        <div style={{ width:"44px",height:"44px",borderRadius:T.radius.md,background:T.color.greenLight,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0 }}>{emoji}</div>
        <div>
          <div style={{ fontFamily:T.font.display, fontSize:"17px", marginBottom:"2px", color:T.color.text }}>{title}</div>
          <div style={{ fontSize:"13px", color:T.color.textMuted, fontFamily:T.font.body }}>{desc}</div>
        </div>
      </div>
    </div>
  );
}

// ─── RESULT CARD ────────────────────────────────────────────
function ResultCard({ parsed, result, onSave, saved, onCompare, onCounter, compact }) {
  const timingMeta = result.timing.includes("PM") ? {icon:"🌙",label:"Evening-Leaning",bg:T.color.pmBg,c:T.color.pm}
    : result.timing.includes("AM") ? {icon:"☀️",label:"Daytime-Leaning",bg:T.color.amBg,c:T.color.am}
    : {icon:"⚖️",label:"Balanced Profile",bg:T.color.balBg,c:T.color.bal};
  const potencyColors = ["Very High","Extremely Strong"].includes(result.potency) ? {bg:`${T.color.warn}14`,c:T.color.warn} : {bg:T.color.surfaceAlt,c:T.color.text};

  return (
    <div style={{
      background:T.color.surface, borderRadius:T.radius.lg, padding: compact?"20px":"28px",
      border:`1px solid ${T.color.borderLight}`, boxShadow:T.shadow.sm,
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: compact?"12px":"18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{fontSize: compact?"22px":"26px"}}>{timingMeta.icon}</span>
          <div>
            <h2 style={{ margin:0, fontSize: compact?"17px":"20px", fontFamily:T.font.display, color:T.color.text }}>{parsed.strainName || timingMeta.label}</h2>
            {parsed.strainName && !compact && <div style={{ fontSize:"12.5px", color:T.color.textMuted, fontFamily:T.font.body, marginTop:"1px" }}>{timingMeta.label}</div>}
          </div>
        </div>
        {onSave && !compact && (
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {onCompare && <Btn small onClick={onCompare}>Compare</Btn>}
            <Btn small onClick={onSave} disabled={saved}>{saved?"✓ Saved":"+ Save"}</Btn>
            {onCounter && <Btn small primary onClick={onCounter}>🛒 Take to Counter</Btn>}
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom: compact?"12px":"18px" }}>
        <Pill bg={timingMeta.bg} color={timingMeta.c}>{result.timing}</Pill>
        <Pill>{result.highType}</Pill>
        <Pill bg={potencyColors.bg} color={potencyColors.c}>{result.potency} Potency</Pill>
        {result.productType && <Pill bg={T.color.greenLight} color={T.color.green}>
          {result.isVape?"Vape / Concentrate":result.productType==="edible"?"Edible":"Flower"}
        </Pill>}
      </div>

      {/* Stats */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom: compact?"8px":"16px" }}>
        {parsed.thc!==null && <StatBox label="THC" value={parsed.thc} unit="%" />}
        {parsed.cbd!==null && <StatBox label="CBD" value={parsed.cbd} unit="%" />}
        {result.cbdThcRatio!==null && <StatBox label="CBD:THC" value={result.cbdThcRatio} unit="" />}
        {result.topTerps.map((t,i) => <StatBox key={i} label={t.displayName} value={t.value} unit="%" />)}
      </div>

      <Spectrum value={result.spectrum} compact={compact} />

      {/* Explanation */}
      {!compact && (
        <>
          <div style={{
            background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"16px",
            fontSize:"14px", lineHeight:1.65, color:T.color.textSec, fontFamily:T.font.body,
            marginTop:"12px",
          }}>{result.explanation}</div>

          {parsed.terpeneWarnings && parsed.terpeneWarnings.length>0 && (
            <div style={{marginTop:"10px"}}><Alert variant="warn">{parsed.terpeneWarnings.join(" ")}</Alert></div>
          )}
          {result.cautions.length>0 && <div style={{marginTop:"10px"}}><Alert variant="warn">{result.cautions.join(" ")}</Alert></div>}

          <div style={{ marginTop:"14px", fontSize:"10px", color:T.color.textFaint, fontFamily:T.font.mono, letterSpacing:"0.05em", textAlign:"center" }}>
            Guide only — not medical advice. Individual experience varies.
          </div>
        </>
      )}
    </div>
  );
}

// ─── SAVED PRODUCT ROW ──────────────────────────────────────
function SavedRow({ entry, onDelete, onSelect, selected, onFeedback }) {
  const timingIcon = entry.result.timing.includes("PM")?"🌙":entry.result.timing.includes("AM")?"☀️":"⚖️";
  return (
    <div onClick={onSelect} style={{
      background:T.color.surface, borderRadius:T.radius.md,
      padding:"16px 18px",
      border:`1.5px solid ${selected?T.color.green:T.color.borderLight}`,
      cursor: onSelect?"pointer":"default",
      transition:"all 0.15s",
      boxShadow: selected?T.shadow.hover:"none",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
            <span style={{fontSize:"16px"}}>{timingIcon}</span>
            <span style={{ fontFamily:T.font.display, fontSize:"16px", color:T.color.text }}>
              {entry.parsed.strainName || "Unnamed Strain"}
            </span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", marginBottom:"4px" }}>
            <Pill small>{entry.result.timing}</Pill>
            <Pill small>{entry.result.potency}</Pill>
            <Pill small>{entry.result.highType}</Pill>
          </div>
          {entry.result.topTerps.length>0 && (
            <div style={{ fontSize:"11.5px", color:T.color.textMuted, fontFamily:T.font.mono, marginTop:"6px" }}>
              {entry.result.topTerps.map(t => `${t.displayName} ${t.value}%`).join("  ·  ")}
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
          {[{key:"liked",emoji:"👍"},{key:"neutral",emoji:"😐"},{key:"disliked",emoji:"👎"}].map(fb => (
            <button key={fb.key}
              onClick={e=>{e.stopPropagation();onFeedback(entry.id, fb.key===entry.feedback?null:fb.key);}}
              style={{
                flex:1, padding:"5px 0", borderRadius:T.radius.sm, border:"none", cursor:"pointer",
                fontSize:"14px", transition:"all 0.15s",
                background: entry.feedback===fb.key
                  ? (fb.key==="liked"?T.color.likedBg:fb.key==="disliked"?T.color.dislikedBg:T.color.neutralBg)
                  : T.color.surfaceAlt,
                opacity: entry.feedback && entry.feedback!==fb.key ? 0.45 : 1,
              }}>{fb.emoji}</button>
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
        <h2 style={{ margin:0, fontFamily:T.font.display, fontSize:"20px" }}>Quick Compare</h2>
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
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"20px" }}>
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
            background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"16px",
            fontSize:"13.5px", lineHeight:1.6, color:T.color.textSec, fontFamily:T.font.body,
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
  // Views: home | text | image | result | saved | compare | mood | moodResult
  const [view, setView] = useState("home");
  const [textInput, setTextInput] = useState("");
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
  const fileRef = useRef();

  // Persist tolerance
  useEffect(() => { localStorage.setItem(TOLERANCE_KEY, tolerance); }, [tolerance]);

  // Load saved on mount
  useEffect(() => {
    loadSaved().then(items => { setSaved(items); setStorageReady(true); });
  }, []);

  // Persist on change
  useEffect(() => {
    if (storageReady) saveToDisk(saved);
  }, [saved, storageReady]);

  const reset = () => {
    setView("home"); setTextInput(""); setImagePreview(null);
    setLoading(false); setError(null); setResult(null); setParsed(null);
    setJustSaved(false); setSelectedMood(null); setShowCounter(false);
  };

  const updateFeedback = (id, feedback) => {
    setSaved(prev => prev.map(e => e.id===id ? {...e, feedback} : e));
  };

  const handleText = () => {
    setError(null);
    const p = parseInput(textInput);
    if (p.terpenes.length===0 && p.thc===null) {
      setError("Couldn't find terpene or THC data. Try: THC: 22% | Myrcene: 0.45% | Limonene: 0.07%");
      return;
    }
    setParsed(p); setResult(classify(p, tolerance)); setView("result");
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setLoading(true); setView("image");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64Full = ev.target.result;
      setImagePreview(b64Full);
      const b64 = b64Full.split(",")[1];
      const mt = file.type||"image/jpeg";
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST", headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({
            model:"claude-sonnet-4-20250514", max_tokens:1000,
            messages:[{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:mt,data:b64}},
              {type:"text",text:`You are analyzing a cannabis product label, terpene panel, or dispensary menu screenshot. Extract ALL cannabis product data you can find.

Return ONLY in this exact format, one item per line, no other text:
Strain: [strain/product name if visible]
THC: [number]%
CBD: [number]% (if visible)
[TerpeneName]: [number]%
Product type: [flower/vape/cart/pre-roll/edible/concentrate] (if visible)

Rules:
- Extract every terpene you can read, using standard names (Myrcene, Limonene, Linalool, Caryophyllene, Pinene, Terpinolene, Humulene, Ocimene, Nerolidol, Bisabolol, Guaiol)
- If you see "Beta-Caryophyllene" just write "Caryophyllene"
- If you see "Beta-Myrcene" just write "Myrcene"
- Include Total Terpenes if shown
- Only include data you can clearly read
- If this doesn't appear to be a cannabis label, say "NOT_CANNABIS_LABEL"`}
            ]}],
          }),
        });
        const data = await resp.json();
        const extracted = data.content?.map(c=>c.text||"").join("")||"";
        if (!extracted.trim() || extracted.includes("NOT_CANNABIS_LABEL")) {
          setError("Couldn't identify cannabis product data in that image. Try a clearer photo of the terpene panel, or paste the values manually.");
          setLoading(false); return;
        }
        const p = parseInput(extracted);
        if (p.terpenes.length===0&&p.thc===null) {
          setError("Found text but couldn't parse terpene or THC data. Try pasting the values manually.");
          setLoading(false); return;
        }
        setParsed(p); setResult(classify(p, tolerance)); setView("result");
      } catch {
        setError("Image analysis failed. Try pasting the values manually.");
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
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

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(180deg, ${T.color.bg} 0%, ${T.color.bgDeep} 100%)`, fontFamily:T.font.body, color:T.color.text }}>
      <style>{`
        @import url('${FONT_URL}');
        @keyframes ssReveal { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ssSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        textarea:focus, button:focus { outline:none; }
        textarea::placeholder { color:${T.color.textFaint}; }
        * { box-sizing:border-box; }
        input[type="file"] { display:none; }
      `}</style>

      <div style={{ maxWidth:"600px", margin:"0 auto", padding:"36px 18px 60px" }}>

        {/* ── HEADER ── */}
        <div onClick={()=>reset()} style={{ textAlign:"center", marginBottom:"28px", cursor:"pointer" }}>
          <div style={{ fontSize:"30px", marginBottom:"2px" }}>🌿</div>
          <h1 style={{
            fontFamily:T.font.display, fontSize:"30px", fontWeight:400,
            margin:"0 0 3px 0", letterSpacing:"-0.01em", color:T.color.text,
          }}>Strain Sense</h1>
          <p style={{ fontSize:"13.5px", color:T.color.textMuted, margin:0, fontFamily:T.font.body, fontWeight:300 }}>
            Make sense of what you're smoking.
          </p>
        </div>

        {/* ── NAV ── */}
        {saved.length>0 && (
          <div style={{ display:"flex", justifyContent:"center", gap:"6px", marginBottom:"22px" }}>
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
                    border:`1px solid ${active?T.color.green:T.color.border}`,
                    background:active?T.color.greenLight:T.color.white,
                    color:active?T.color.green:T.color.textMuted,
                    fontSize:"12.5px", fontFamily:T.font.mono, fontWeight:500,
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
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", animation:"ssReveal 0.35s ease-out" }}>
            <HomeCard emoji="📸" title="Analyze Photo"
              desc="Product label, terpene panel, or dispensary screenshot"
              onClick={()=>{setView("image");setTimeout(()=>fileRef.current?.click(),100);}} />
            <HomeCard emoji="📋" title="Paste Terpene Profile"
              desc="Type or paste THC, terpenes, and percentages"
              onClick={()=>setView("text")} />
            <HomeCard emoji="✨" title="How Do You Want to Feel?"
              desc="Pick a mood — we'll tell you what to look for"
              onClick={()=>setView("mood")} />
            <div style={{ background:T.color.surface, borderRadius:T.radius.md, padding:"16px", border:`1px solid ${T.color.borderLight}` }}>
              <ToleranceSelector value={tolerance} onChange={setTolerance} />
            </div>
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* TEXT INPUT                                       */}
        {/* ════════════════════════════════════════════════ */}
        {view==="text" && (
          <div style={{animation:"ssReveal 0.3s ease-out"}}>
            <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
              placeholder={"Paste terpene info, e.g.:\nStrain: Blue Dream\nTHC: 22.3%\nMyrcene: 0.45%\nLimonene: 0.07%\nLinalool: 0.08%"}
              rows={7} style={{
                width:"100%", padding:"16px", borderRadius:T.radius.lg,
                border:`1px solid ${T.color.border}`, background:T.color.white,
                fontSize:"14px", fontFamily:T.font.mono, lineHeight:1.6,
                color:T.color.text, resize:"vertical",
              }} />
            <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
              <Btn onClick={reset}>← Back</Btn>
              <Btn primary onClick={handleText} style={{flex:1}}>Translate</Btn>
            </div>
          </div>
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
                <div style={{fontSize:"28px",marginBottom:"10px",animation:"ssSpin 1.2s linear infinite"}}>🌿</div>
                <div style={{fontFamily:T.font.mono,fontSize:"13px"}}>Analyzing image...</div>
                <div style={{fontFamily:T.font.body,fontSize:"12px",color:T.color.textFaint,marginTop:"6px"}}>Reading label data and extracting terpenes</div>
              </div>
            )}

            {!loading && !imagePreview && (
              <>
                <div onClick={()=>fileRef.current?.click()} style={{
                  border:`2px dashed ${T.color.border}`, borderRadius:T.radius.lg, padding:"44px 20px",
                  textAlign:"center", cursor:"pointer", background:T.color.surface, transition:"all 0.2s",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.color.green;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.color.border;}}
                >
                  <div style={{fontSize:"36px",marginBottom:"8px"}}>📸</div>
                  <div style={{fontSize:"14px",color:T.color.textSec,fontWeight:500,marginBottom:"4px"}}>Tap to upload a photo</div>
                  <div style={{fontSize:"12px",color:T.color.textMuted}}>Product label · Terpene panel · Menu screenshot</div>
                </div>

                {/* Tip card */}
                <div style={{
                  background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"14px 16px", marginTop:"12px",
                  fontSize:"12.5px", color:T.color.textMuted, lineHeight:1.5, fontFamily:T.font.body,
                }}>
                  <strong style={{color:T.color.textSec}}>Tips for best results:</strong>
                  <div style={{marginTop:"4px"}}>
                    Make sure THC % and terpene names/percentages are clearly visible. Works with photos of jars, bags, stickers, COA sheets, and dispensary menu screenshots.
                  </div>
                </div>
              </>
            )}

            <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
              <Btn onClick={reset}>← Back</Btn>
              {imagePreview && !loading && <Btn onClick={()=>fileRef.current?.click()} style={{flex:1}}>Try different photo</Btn>}
            </div>
          </div>
        )}


        {/* ════════════════════════════════════════════════ */}
        {/* MOOD SELECTOR                                   */}
        {/* ════════════════════════════════════════════════ */}
        {view==="mood" && (
          <div style={{animation:"ssReveal 0.3s ease-out"}}>
            <h2 style={{ fontFamily:T.font.display, fontSize:"20px", margin:"0 0 4px 0" }}>How do you want to feel?</h2>
            <p style={{ fontSize:"13px", color:T.color.textMuted, margin:"0 0 18px 0" }}>Pick a mood and we'll tell you what terpenes to look for.</p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
              {MOOD_PRESETS.map(m => (
                <div key={m.id} onClick={()=>setSelectedMood(m.id===selectedMood?null:m.id)} style={{
                  background:T.color.white, borderRadius:T.radius.md, padding:"16px",
                  border:`1.5px solid ${selectedMood===m.id?T.color.green:T.color.borderLight}`,
                  cursor:"pointer", transition:"all 0.15s",
                  boxShadow:selectedMood===m.id?T.shadow.hover:"none",
                }}>
                  <div style={{fontSize:"22px",marginBottom:"6px"}}>{m.emoji}</div>
                  <div style={{fontFamily:T.font.display,fontSize:"15px",color:T.color.text,marginBottom:"2px"}}>{m.label}</div>
                  <div style={{fontSize:"12px",color:T.color.textMuted}}>{m.desc}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:"8px"}}>
              <Btn onClick={reset}>← Back</Btn>
              <Btn primary disabled={!selectedMood} onClick={()=>setView("moodResult")} style={{flex:1}}>Show Me →</Btn>
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
                border:`1px solid ${T.color.borderLight}`, boxShadow:T.shadow.sm,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"18px"}}>
                  <span style={{fontSize:"28px"}}>{mood.emoji}</span>
                  <div>
                    <h2 style={{margin:0,fontFamily:T.font.display,fontSize:"20px"}}>{mood.label}</h2>
                    <div style={{fontSize:"13px",color:T.color.textMuted,marginTop:"2px"}}>{mood.desc}</div>
                  </div>
                </div>

                <div style={{fontSize:"11px",fontFamily:T.font.mono,color:T.color.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"8px"}}>Look for these terpenes</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"18px"}}>
                  {mood.terpenes.map(t => {
                    const display = DISPLAY[t] || t;
                    const note = NOTES[t];
                    return (
                      <div key={t} style={{
                        background:T.color.greenLight, borderRadius:T.radius.md, padding:"12px 16px",
                        flex:"1 1 auto", minWidth:"140px",
                      }}>
                        <div style={{fontFamily:T.font.display,fontSize:"15px",color:T.color.green,marginBottom:"2px"}}>{display}</div>
                        {note && <div style={{fontSize:"11.5px",color:T.color.textMuted,lineHeight:1.4}}>{note}</div>}
                      </div>
                    );
                  })}
                </div>

                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"16px"}}>
                  <Pill bg={mood.timing.includes("PM")?T.color.pmBg:mood.timing.includes("AM")?T.color.amBg:T.color.balBg}
                    color={mood.timing.includes("PM")?T.color.pm:mood.timing.includes("AM")?T.color.am:T.color.bal}>
                    {mood.timing}
                  </Pill>
                  <Pill>{mood.highType}</Pill>
                </div>

                <div style={{
                  background:T.color.surfaceAlt, borderRadius:T.radius.md, padding:"16px",
                  fontSize:"13.5px", lineHeight:1.6, color:T.color.textSec, fontFamily:T.font.body,
                }}>
                  When shopping, look for products where {mood.terpenes.map(t=>DISPLAY[t]||t).join(", ")} appear as dominant terpenes. These are most commonly associated with {mood.desc.toLowerCase()} effects. Remember that individual response varies — this is a starting point, not a guarantee.
                </div>

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
                      <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
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
                <Btn onClick={reset}>🌿 Home</Btn>
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
            <ResultCard
              parsed={parsed} result={result}
              onSave={saveProduct} saved={justSaved}
              onCompare={saved.length>0 ? ()=>setView("compare") : null}
              onCounter={()=>setShowCounter(true)}
            />
            <div style={{display:"flex",gap:"8px",justifyContent:"center",marginTop:"20px"}}>
              <Btn onClick={reset}>🌿 Analyze Another</Btn>
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
            <h2 style={{ fontFamily:T.font.display, fontSize:"20px", margin:"0 0 16px 0" }}>Saved Products</h2>

            {saved.length===0 ? (
              <div style={{textAlign:"center",padding:"40px 20px",color:T.color.textMuted}}>
                <div style={{fontSize:"28px",marginBottom:"8px"}}>📦</div>
                <div style={{fontSize:"14px"}}>No products saved yet.</div>
                <div style={{fontSize:"12.5px",marginTop:"4px"}}>Analyze a product and tap "Save" to keep it here.</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {saved.map(e => (
                  <SavedRow key={e.id} entry={e} onDelete={deleteProduct} onFeedback={updateFeedback} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {showCounter && parsed && result && (
        <CounterCard parsed={parsed} result={result} onClose={()=>setShowCounter(false)} />
      )}
    </div>
  );
}
