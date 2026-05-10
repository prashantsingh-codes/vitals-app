import { useState } from "react";

export function AddFoodModal({ onAdd, onClose }) {
  const DRAFT_KEY = "vt_food_draft";
  const draft = (() => { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; } })();

  const [name, setName] = useState(draft.name || "");
  const [cal, setCal] = useState(draft.cal || "");
  const [pro, setPro] = useState(draft.pro || "");
  const [fat, setFat] = useState(draft.fat || "");
  const [error, setError] = useState("");

  function saveDraft(patch) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, cal, pro, fat, ...patch }));
  }

  function submit() {
    if (!name.trim()) { setError("Please enter a food name"); return; }
    if (!cal || isNaN(cal) || Number(cal) < 0) { setError("Enter valid calories"); return; }
    setError("");
    sessionStorage.removeItem(DRAFT_KEY);
    onAdd({ name: name.trim(), cal: Number(cal), pro: Number(pro) || 0, fat: Number(fat) || 0 });
    onClose();
  }

  const inp = { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>➕ Add Custom Food</div>
          <button onClick={onClose} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Food Name *</div>
            <input value={name} onChange={(e) => { setName(e.target.value); saveDraft({ name: e.target.value }); }} placeholder="e.g. Sprouts salad, Protein bar…" style={inp} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[{ key: "cal", label: "Calories *", color: "var(--accent)", val: cal, set: setCal, placeholder: "kcal" }, { key: "pro", label: "Protein (g)", color: "var(--green)", val: pro, set: setPro, placeholder: "g" }, { key: "fat", label: "Fat (g)", color: "var(--amber)", val: fat, set: setFat, placeholder: "g" }].map((f) => (
              <div key={f.key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: f.color, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{f.label}</div>
                <input value={f.val} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }} placeholder={f.placeholder} type="number" min="0" step="0.1" style={inp} />
              </div>
            ))}
          </div>
          {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500, background: "var(--accentBg)", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--text2)", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={submit} style={{ flex: 2, background: "var(--accent)", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>Add Food</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomFoodChip({ food, onToggle, onDelete, onPromote, isPromoted }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: food.checked ? "var(--accentBg)" : "var(--surface2)", border: `1px solid ${food.checked ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, padding: "10px 8px 10px 10px", position: "relative", minWidth: 0 }}>
      <button onClick={onDelete} title="Remove" style={{ position: "absolute", top: 4, right: 4, background: "var(--bg3)", border: "none", borderRadius: 99, width: 18, height: 18, cursor: "pointer", fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>✕</button>
      <div onClick={onToggle} style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: `1.5px solid ${food.checked ? "var(--accent)" : "var(--border2)"}`, background: food.checked ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {food.checked && <svg viewBox="0 0 10 8" width="10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 4,7 9,1" /></svg>}
      </div>
      <div onClick={onToggle} style={{ flex: 1, cursor: "pointer", minWidth: 0, paddingRight: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: food.checked ? "var(--accent)" : "var(--text)", wordBreak: "break-word", lineHeight: 1.3 }}>{food.name}</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{food.cal}kcal · {food.pro}g P · {food.fat}g F</div>
      </div>
      <button onClick={onPromote} title={isPromoted ? "Already in preset list" : "Add to preset Food list"}
        style={{ background: isPromoted ? "var(--greenBg)" : "var(--surface)", border: `1px solid ${isPromoted ? "var(--green)" : "var(--border2)"}`, borderRadius: 6, width: 28, height: 28, marginTop: 14, alignSelf: "flex-end", cursor: isPromoted ? "default" : "pointer", fontSize: 14, color: isPromoted ? "var(--green)" : "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        📌
      </button>
    </div>
  );
}
