import { useState } from "react";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateStrOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DatePickerBar({ selectedDate, onDateChange, isMobile }) {
  const today = todayStr();
  const days = Array.from({ length: 8 }, (_, i) => dateStrOffset(-(7 - i)));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (isMobile) {
    return (
      <div style={{ marginBottom: 16, position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
          {selectedDate === today ? "Today's Log" : `Logging for ${selectedDate}`}
        </div>
        <button onClick={() => setDropdownOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", border: "1.5px solid var(--accent)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
          <span>📅 {selectedDate === today ? "Today" : selectedDate}</span>
          <span style={{ fontSize: 12, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform .2s", display: "inline-block" }}>▾</span>
        </button>
        {dropdownOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.15)", zIndex: 200, overflow: "hidden" }}>
            {[...days].reverse().map((d) => {
              const isToday = d === today, isSelected = d === selectedDate;
              return (
                <button key={d} onClick={() => { onDateChange(d); setDropdownOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: isSelected ? "var(--accentBg)" : "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit", color: isSelected ? "var(--accent)" : isToday ? "var(--accent)" : "var(--text)", fontWeight: isSelected || isToday ? 700 : 400, fontSize: 14 }}>
                  <span>{isToday ? "📅 Today" : d}</span>
                  {isSelected && <span style={{ fontSize: 12 }}>✓</span>}
                </button>
              );
            })}
          </div>
        )}
        {dropdownOpen && <div onClick={() => setDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />}
        {selectedDate !== today && (
          <button onClick={() => onDateChange(today)} style={{ marginTop: 8, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, width: "100%" }}>
            ← Back to Today
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
        {selectedDate === today ? "Today's Log" : `Logging for ${selectedDate}`}
        {selectedDate !== today && (
          <button onClick={() => onDateChange(today)} style={{ marginLeft: 10, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>← Back to Today</button>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
        {days.map((d) => {
          const isToday = d === today, isSelected = d === selectedDate;
          return (
            <button key={d} onClick={() => onDateChange(d)}
              style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`, background: isSelected ? "var(--accent)" : isToday ? "var(--accentBg)" : "var(--surface2)", color: isSelected ? "#fff" : isToday ? "var(--accent)" : "var(--text3)", fontSize: 11, fontWeight: isSelected || isToday ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
              {isToday ? "Today" : d.slice(5).replace("-", "/")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
