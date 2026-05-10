import { useState } from "react";

// ─── Shared UI Components ─────────────────────────────────────────────────────

export function ProgBar({ val, max, color }) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 99, overflow: "hidden", background: "var(--bg3)" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 99, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--text3)", width: 34, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

export function MacroPill({ val, unit, label, rem, color }) {
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, marginBottom: 2 }}>{val}{unit}</div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text3)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{rem}</div>
    </div>
  );
}

export function Stepper({ val, onChange, max = 20 }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 99, overflow: "hidden" }}>
      <button onClick={() => onChange(Math.max(0, val - 1))} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: "8px 14px", fontSize: 18, fontFamily: "inherit" }}>−</button>
      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", padding: "0 8px", minWidth: 28, textAlign: "center", display: "flex", alignItems: "center" }}>{val}</span>
      <button onClick={() => onChange(Math.min(max, val + 1))} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: "8px 14px", fontSize: 18, fontFamily: "inherit" }}>+</button>
    </div>
  );
}

export function MiniStepper({ val, onChange }) {
  const btnBase = { border: "1px solid var(--border2)", cursor: "pointer", fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", height: 26, minWidth: 28, padding: "0 8px" };
  return (
    <div style={{ display: "flex", marginTop: 6 }}>
      <button onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, val - 1)); }} style={{ ...btnBase, background: "var(--bg3)", borderRadius: "6px 0 0 6px", color: "var(--text2)" }}>−</button>
      <span style={{ ...btnBase, fontSize: 13, fontWeight: 700, color: val > 0 ? "var(--accent)" : "var(--text3)", padding: "0 10px", borderLeft: "none", borderRight: "none", borderRadius: 0, minWidth: 32, background: val > 0 ? "var(--accentBg)" : "var(--surface2)", cursor: "default" }}>{val}</span>
      <button onClick={(e) => { e.stopPropagation(); onChange(Math.min(20, val + 1)); }} style={{ ...btnBase, background: val > 0 ? "var(--accent)" : "var(--bg3)", border: `1px solid ${val > 0 ? "var(--accent)" : "var(--border2)"}`, borderRadius: "0 6px 6px 0", color: val > 0 ? "#fff" : "var(--text2)" }}>+</button>
    </div>
  );
}

export function Card({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(26,24,20,.06),0 4px 16px rgba(26,24,20,.08)" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 18px", cursor: "pointer", userSelect: "none" }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".07em" }}>{title}</span>
        <span style={{ color: "var(--text3)", fontSize: 13, display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform .25s" }}>▾</span>
      </div>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}
