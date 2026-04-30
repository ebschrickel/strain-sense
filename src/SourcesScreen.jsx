import { useEffect, useRef } from "react";
import { SOURCES, getActiveSources } from "./sources";

// ═══════════════════════════════════════════════════════════
// SOURCES SCREEN
// Backs every health/terpene claim in the app per
// App Store Review Guideline 1.4.1 (Safety / Physical Harm).
// Visual language matches StrainSense.jsx — cream + green palette.
// ═══════════════════════════════════════════════════════════

const T = {
  color: {
    bg:           "#f3f1ea",
    surface:      "#faf9f5",
    surfaceAlt:   "#f0ede4",
    border:       "#dedad2",
    borderLight:  "#eae6dc",
    text:         "#2c2c24",
    textSec:      "#5c5c50",
    textMuted:    "#908e82",
    green:        "#4d6b3d",
    greenDeep:    "#3b5530",
    greenLight:   "#e6efe0",
  },
  font: {
    display: "'DM Serif Display', Georgia, system-ui, serif",
    body:    "'Libre Franklin', 'Helvetica Neue', system-ui, sans-serif",
    mono:    "'IBM Plex Mono', system-ui, monospace",
  },
  radius: { md: "12px", lg: "16px", pill: "24px" },
  shadow: { sm: "0 1px 4px rgba(44,44,36,0.06)" },
};

// Open external links via the OS default browser.
// In Capacitor WebView, window.open(url, "_system") routes through the
// Capacitor URL handler -> opens Safari (iOS) / default browser (Android).
// In the web preview, falls back to a normal new tab.
function openExternal(url) {
  try {
    window.open(url, "_system");
  } catch (e) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function SourcesScreen({ onBack, focusId }) {
  const containerRef = useRef(null);

  // Scroll to a specific source if a citation marker linked us here.
  useEffect(() => {
    if (!focusId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-source-id="${focusId}"]`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.style.boxShadow = "0 0 0 2px " + T.color.green;
      setTimeout(() => { el.style.boxShadow = T.shadow.sm; }, 1800);
    }
  }, [focusId]);

  const sources = getActiveSources();

  return (
    <div ref={containerRef} style={{ animation: "ssReveal 0.3s ease-out" }}>
      <div style={{
        background: T.color.surface,
        borderRadius: T.radius.lg,
        padding: "24px",
        border: `1px solid ${T.color.borderLight}`,
        boxShadow: T.shadow.sm,
      }}>
        <h2 style={{
          fontFamily: T.font.display, fontSize: "24px", fontWeight: 400,
          margin: "0 0 6px 0", color: T.color.text, letterSpacing: "-0.01em",
        }}>
          Sources &amp; Citations
        </h2>
        <p style={{
          fontSize: "13px", color: T.color.textSec, fontFamily: T.font.body,
          lineHeight: 1.6, margin: "0 0 18px 0",
        }}>
          Every effect and terpene description in Strain Sense is backed by
          peer-reviewed research. Tap any citation below to read the original source.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sources.map((s) => (
            <div
              key={s.id}
              data-source-id={s.id}
              style={{
                background: T.color.surfaceAlt,
                border: `1px solid ${T.color.borderLight}`,
                borderLeft: `3px solid ${T.color.green}`,
                borderRadius: T.radius.md,
                padding: "14px 16px",
                transition: "box-shadow 0.4s ease",
                boxShadow: T.shadow.sm,
              }}
            >
              <div style={{
                display: "flex", alignItems: "baseline", gap: "10px",
                marginBottom: "6px", flexWrap: "wrap",
              }}>
                <span style={{
                  fontFamily: T.font.mono, fontSize: "11px",
                  color: T.color.green, fontWeight: 600,
                  letterSpacing: "0.04em",
                }}>
                  [{s.id}]
                </span>
                <span style={{
                  fontFamily: T.font.display, fontSize: "15px",
                  color: T.color.text, fontWeight: 400,
                }}>
                  {s.label}
                </span>
              </div>

              <div style={{
                fontSize: "13px", color: T.color.textSec,
                fontFamily: T.font.body, lineHeight: 1.5,
                marginBottom: "10px",
              }}>
                {s.summary}
              </div>

              <div style={{
                fontSize: "11px", color: T.color.textMuted,
                fontFamily: T.font.mono, lineHeight: 1.5,
                marginBottom: "10px", wordBreak: "break-word",
              }}>
                {s.citation}
              </div>

              <button
                onClick={() => openExternal(s.url)}
                aria-label={`Open original research for source ${s.id}: ${s.label}. Opens in browser.`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: T.color.greenLight, color: T.color.greenDeep,
                  border: `1px solid ${T.color.green}`,
                  borderRadius: T.radius.pill,
                  padding: "7px 14px",
                  fontFamily: T.font.mono, fontSize: "12px", fontWeight: 500,
                  cursor: "pointer", minHeight: "44px", minWidth: "44px",
                  textDecoration: "none",
                }}
              >
                Read source →
              </button>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "20px", padding: "14px 16px",
          background: T.color.bg, borderRadius: T.radius.md,
          border: `1px solid ${T.color.borderLight}`,
          fontSize: "12px", color: T.color.textMuted,
          fontFamily: T.font.body, lineHeight: 1.6,
        }}>
          Strain Sense is an educational tool, not medical advice. Cannabis
          affects each person differently. If you have a medical condition or
          take prescription medication, talk to a healthcare provider before use.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
        <button
          onClick={onBack}
          style={{
            background: T.color.surfaceAlt,
            border: `1px solid ${T.color.border}`,
            borderRadius: T.radius.pill,
            padding: "9px 20px",
            fontFamily: T.font.mono, fontSize: "12px", fontWeight: 500,
            color: T.color.textSec, cursor: "pointer",
            minHeight: "44px",
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
