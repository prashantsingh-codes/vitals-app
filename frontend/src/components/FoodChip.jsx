import { useState } from "react";
import { MiniStepper } from "./UI.jsx";

const MACROS = {
  milk: { cal: 85, pro: 6, fat: 3, label: "Milk" },
  oats: { cal: 111, pro: 3.8, fat: 2.4, label: "Oats" },
  whey: { cal: 140, pro: 25, fat: 1.8, label: "Whey" },
  rice: { cal: 250, pro: 4, fat: 0.5, label: "Rice" },
  paneer50: { cal: 102, pro: 12.5, fat: 4.5, label: "Paneer 50g" },
  paneer100: { cal: 203.8, pro: 25, fat: 9, label: "Paneer 100g" },
  dal: { cal: 300, pro: 15, fat: 3, label: "Dal" },
  soya: { cal: 175, pro: 25, fat: 1, label: "Soya Chunks" },
  wholeEgg: { cal: 67, pro: 6, fat: 5, label: "Whole Egg" },
  eggWhite: { cal: 17, pro: 3.6, fat: 0, label: "Egg White" },
};

function FOOD_LABEL(f) {
  if (f.id === "milk1") return "Milk 1";
  if (f.id === "milk2") return "Milk 2";
  if (f.id === "milk3") return "Milk 3";
  if (f.id === "dal1") return "Dal (bowl 1)";
  if (f.id === "dal2") return "Dal (bowl 2)";
  return MACROS[f.key]?.label || f.label || f.id;
}

export default function FoodChip({ food, count, onCountChange, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  let label, subLine;
  if (food._promoted) {
    label = food.label;
    subLine = count > 1 ? `${food.cal * count}kcal · ${(food.pro * count).toFixed(1)}g P` : `${food.cal}kcal · ${food.pro}g P · ${food.fat}g F`;
  } else {
    const m = MACROS[food.key];
    label = FOOD_LABEL(food);
    subLine = count > 1 ? `${m.cal * count}kcal · ${(m.pro * count).toFixed(1)}g P` : `${m.cal}kcal · ${m.pro}g P · ${m.fat}g F`;
  }

  const checked = count > 0;

  if (food._promoted && confirmDelete) {
    return (
      <div style={{ background: "var(--amberBg)", border: "1px solid var(--amber)", borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", marginBottom: 8 }}>Remove "{label}" from presets?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => { onDelete("permanent"); setConfirmDelete(false); }} style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            🗑 Delete permanently
            <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85, marginTop: 1 }}>Won't return on "Restore presets" · stays in Custom Foods</div>
          </button>
          <button onClick={() => { onDelete("today"); setConfirmDelete(false); }} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "var(--text)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            📅 Delete for today
            <div style={{ fontSize: 10, fontWeight: 400, color: "var(--text3)", marginTop: 1 }}>Returns when you "Restore presets" · stays in Custom Foods</div>
          </button>
          <button onClick={() => setConfirmDelete(false)} style={{ background: "none", border: "none", fontSize: 11, color: "var(--text3)", cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", background: checked ? "var(--accentBg)" : "var(--surface2)", border: `1px solid ${checked ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", position: "relative", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div onClick={() => onCountChange(checked ? 0 : 1)} style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${checked ? "var(--accent)" : "var(--border2)"}`, background: checked ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {checked && <svg viewBox="0 0 10 8" width="10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 4,7 9,1" /></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: checked ? "var(--accent)" : "var(--text)", wordBreak: "break-word", lineHeight: 1.3 }}>
            {label}
            {food._promoted && <span style={{ marginLeft: 5, fontSize: 9, background: "var(--greenBg)", color: "var(--green)", borderRadius: 4, padding: "1px 5px", fontWeight: 700, verticalAlign: "middle" }}>MY FOOD</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", wordBreak: "break-word", lineHeight: 1.3 }}>{subLine}</div>
        </div>
      </div>
      <MiniStepper val={count} onChange={onCountChange} />
      <button onClick={() => food._promoted ? setConfirmDelete(true) : onDelete("today")} title="Remove from presets"
        style={{ position: "absolute", top: 4, right: 4, background: "var(--bg3)", border: "none", borderRadius: 99, width: 18, height: 18, cursor: "pointer", fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
        ✕
      </button>
    </div>
  );
}
