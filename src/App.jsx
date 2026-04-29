import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api.js";

// ─── Design tokens ───────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F7F5F0", bg2: "#EEEBE3", bg3: "#E4E0D6",
  surface: "#FFFFFF", surface2: "#F7F5F0",
  text: "#1A1814", text2: "#5C5849", text3: "#9A9386",
  accent: "#D4582A", accent2: "#E8835C", accentBg: "#FBE9E2",
  border: "#D9D4C7", border2: "#C9C3B3",
  green: "#2D7A5C", greenBg: "#E6F4EE",
  amber: "#B8861A", amberBg: "#FBF3E0",
  blue: "#2563EB", blueBg: "#EFF6FF",
};
const DARK = {
  bg: "#141210", bg2: "#1C1A17", bg3: "#242119",
  surface: "#1F1D19", surface2: "#252219",
  text: "#F0EDE6", text2: "#A89F8E", text3: "#6B6358",
  accent: "#E8835C", accent2: "#D4582A", accentBg: "#2A1C14",
  border: "#2E2B24", border2: "#3A362D",
  green: "#4CAF85", greenBg: "#0F2319",
  amber: "#D4A435", amberBg: "#221B0A",
  blue: "#60A5FA", blueBg: "#1E3A5F",
};

// ─── Macros data ──────────────────────────────────────────────────────────────
const MACROS = {
  milk:     { cal: 85,  pro: 6,  fat: 3,   label: "Milk" },
  oats:     { cal: 111, pro: 3.75,  fat: 2.4,   label: "Oats" },
  whey:     { cal: 140, pro: 25, fat: 1.8,   label: "Whey" },
  rice:     { cal: 250, pro: 4,  fat: 0.5, label: "Rice" },
  paneer50: { cal: 102,  pro: 12.5, fat: 4.5,   label: "Paneer 50g" },
  paneer100:{ cal: 203.8, pro: 25, fat: 9,   label: "Paneer 100g" },
  dal:      { cal: 320, pro: 19, fat: 3,   label: "Dal" },
  soya:     { cal: 175, pro: 25, fat: 1,  label: "Soya Chunks" },
  wholeEgg: { cal: 67,  pro: 6,  fat: 5,   label: "Whole Egg" },
  eggWhite: { cal: 17,  pro: 3.6, fat: 0,   label: "Egg White" },
};
const FOODS = [
  { id: "milk1",    key: "milk",      section: "Milk" },
  { id: "milk2",    key: "milk",      section: "Milk" },
  { id: "milk3",    key: "milk",      section: "Milk" },
  { id: "oats",     key: "oats",      section: "Grains & Protein" },
  { id: "whey",     key: "whey",      section: "Grains & Protein" },
  { id: "rice",     key: "rice",      section: "Grains & Protein" },
  { id: "paneer50", key: "paneer50",  section: "Paneer" },
  { id: "paneer100",key: "paneer100", section: "Paneer" },
  { id: "dal1",     key: "dal",       section: "Dal" },
  { id: "dal2",     key: "dal",       section: "Dal" },
  { id: "soya",     key: "soya",      section: "Soya" },
];
const FOOD_LABEL = (f) =>
  f.id === "milk1" ? "Milk 1" : f.id === "milk2" ? "Milk 2" : f.id === "milk3" ? "Milk 3" :
  f.id === "dal1" ? "Dal (bowl 1)" : f.id === "dal2" ? "Dal (bowl 2)" : MACROS[f.key].label;

// ─── Motivational quotes ──────────────────────────────────────────────────────
const MOTIVATIONAL_QUOTES = [
  "The body achieves what the mind believes. 💪",
  "Discipline is choosing between what you want now and what you want most.",
  "Small steps every day add up to big results. 🏆",
  "You don't have to be extreme, just consistent.",
  "Your only competition is who you were yesterday.",
  "Eat well, move daily, hydrate often, sleep lots. 🌿",
  "Success is the sum of small efforts repeated daily.",
  "One day or day one — you decide. ⚡",
  "Strive for progress, not perfection.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Make yourself proud. Every single day.",
  "Momentum is built one rep, one meal, one choice at a time.",
  "Believe in the process — results follow consistency. 🔥",
  "Fuel your ambition, nourish your body.",
  "You are stronger than your excuses. 💥",
];

// Default onboarding targets (used before onboarding completes)
const DEFAULT_TARGETS = { cal: 1800, pro: 130, fat: 55 };

// ─── Health tips ──────────────────────────────────────────────────────────────
const HEALTH_TIPS = [
  "💧 Drink at least 8 glasses of water today",
  "🚶 A 20-min walk after meals improves digestion",
  "😴 Quality sleep boosts muscle recovery",
  "🧘 5 mins of deep breathing lowers cortisol",
  "🥦 Eat a rainbow — variety = micronutrients",
  "⏰ Try eating dinner before 8pm for better sleep",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function calcMacros(items, wholeEggs, eggWhites, customFoods = [], presetFoodList = FOODS) {
  let cal = 0, pro = 0, fat = 0;
  presetFoodList.forEach(f => { if (items[f.id]) { cal += MACROS[f.key].cal; pro += MACROS[f.key].pro; fat += MACROS[f.key].fat; } });
  cal += wholeEggs * MACROS.wholeEgg.cal + eggWhites * MACROS.eggWhite.cal;
  pro += wholeEggs * MACROS.wholeEgg.pro + eggWhites * MACROS.eggWhite.pro;
  fat += wholeEggs * MACROS.wholeEgg.fat;
  customFoods.forEach(f => { if (f.checked) { cal += Number(f.cal)||0; pro += Number(f.pro)||0; fat += Number(f.fat)||0; } });
  return { cal: Math.round(cal), pro: Math.round(pro * 10) / 10, fat: Math.round(fat * 10) / 10 };
}

// ─── Styles helper ────────────────────────────────────────────────────────────
const S = (obj) => Object.entries(obj).map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}`).join(";");

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Progress bar
function ProgBar({ val, max, color }) {
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

// Macro pill
function MacroPill({ val, unit, label, rem, color }) {
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, marginBottom: 2 }}>{val}{unit}</div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text3)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{rem}</div>
    </div>
  );
}

// Stepper
function Stepper({ val, onChange, max = 20 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 99, overflow: "hidden" }}>
      <button onClick={() => onChange(Math.max(0, val - 1))} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: "8px 14px", fontSize: 18, lineHeight: 1, fontFamily: "inherit" }}>−</button>
      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", padding: "0 8px", minWidth: 28, textAlign: "center" }}>{val}</span>
      <button onClick={() => onChange(Math.min(max, val + 1))} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: "8px 14px", fontSize: 18, lineHeight: 1, fontFamily: "inherit" }}>+</button>
    </div>
  );
}

// Card wrapper
function Card({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(26,24,20,.06),0 4px 16px rgba(26,24,20,.08)", overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 18px", cursor: "pointer", userSelect: "none" }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".07em" }}>{title}</span>
        <span style={{ color: "var(--text3)", fontSize: 13, transition: "transform .25s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </div>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

// Food chip
function FoodChip({ food, checked, onToggle }) {
  const m = MACROS[food.key];
  const label = FOOD_LABEL(food);
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 8,
      background: checked ? "var(--accentBg)" : "var(--surface2)",
      border: `1px solid ${checked ? "var(--accent)" : "var(--border)"}`,
      borderRadius: 10, padding: "10px 12px", cursor: "pointer",
      transition: "all .2s"
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${checked ? "var(--accent)" : "var(--border2)"}`,
        background: checked ? "var(--accent)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {checked && <svg viewBox="0 0 10 8" width="10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 4,7 9,1" /></svg>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: checked ? "var(--accent)" : "var(--text)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>{m.cal}kcal · {m.pro}g P · {m.fat}g F</div>
      </div>
    </div>
  );
}

// Add Food Modal
function AddFoodModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [pro, setPro] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) { setError("Please enter a food name"); return; }
    if (!cal || isNaN(cal) || Number(cal) < 0) { setError("Enter valid calories"); return; }
    setError("");
    onAdd({ name: name.trim(), cal: Number(cal), pro: Number(pro) || 0, fat: Number(fat) || 0 });
    onClose();
  }

  const inp = {
    background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20,
        padding: 28, width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,.25)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>➕ Add Custom Food</div>
          <button onClick={onClose} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Food Name *</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sprouts salad, Protein bar…" style={inp} autoFocus />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Calories *</div>
              <input value={cal} onChange={e => setCal(e.target.value)} placeholder="kcal" type="number" min="0" style={{ ...inp }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Protein (g)</div>
              <input value={pro} onChange={e => setPro(e.target.value)} placeholder="g" type="number" min="0" step="0.1" style={{ ...inp }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Fat (g)</div>
              <input value={fat} onChange={e => setFat(e.target.value)} placeholder="g" type="number" min="0" step="0.1" style={{ ...inp }} />
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500, background: "var(--accentBg)", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10,
              padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--text2)", fontFamily: "inherit"
            }}>Cancel</button>
            <button onClick={submit} style={{
              flex: 2, background: "var(--accent)", border: "none", borderRadius: 10,
              padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "inherit"
            }}>Add Food</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom food chip
function CustomFoodChip({ food, onToggle, onDelete }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: food.checked ? "var(--accentBg)" : "var(--surface2)",
      border: `1px solid ${food.checked ? "var(--accent)" : "var(--border)"}`,
      borderRadius: 10, padding: "10px 12px", transition: "all .2s"
    }}>
      <div onClick={onToggle} style={{
        width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: "pointer",
        border: `1.5px solid ${food.checked ? "var(--accent)" : "var(--border2)"}`,
        background: food.checked ? "var(--accent)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {food.checked && <svg viewBox="0 0 10 8" width="10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 4,7 9,1" /></svg>}
      </div>
      <div onClick={onToggle} style={{ flex: 1, cursor: "pointer" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: food.checked ? "var(--accent)" : "var(--text)" }}>{food.name}</div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>{food.cal}kcal · {food.pro}g P · {food.fat}g F</div>
      </div>
      <button onClick={onDelete} style={{
        background: "none", border: "none", cursor: "pointer", color: "var(--text3)",
        fontSize: 16, padding: "2px 4px", lineHeight: 1, borderRadius: 6,
        transition: "color .15s"
      }} title="Remove">🗑</button>
    </div>
  );
}

const GREETING = { role: "assistant", text: "Hi! I'm your AI health coach. Ask me anything about nutrition, macros, or your goals." };

//AI Chatbot
function AIChatbot() {
  const [msgs, setMsgs] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send() {
    const q = input.trim();
    if (!q) return;

    const userMsg = { role: "user", text: q };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("vt_token");

      // ✅ Skip the greeting, only send real conversation to Gemini
      const apiMessages = newMsgs
        .filter(m => m !== GREETING)
        .map(m => ({ role: m.role, content: m.text }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      console.log("SERVER RESPONSE:", JSON.stringify(data));
      const reply = data.reply || "Sorry, I couldn't respond right now.";
      setMsgs(m => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", text: "Network error — please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 340 }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8, maxHeight: 340 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "var(--accent)" : "var(--surface2)",
              color: m.role === "user" ? "#fff" : "var(--text)", fontSize: 13, lineHeight: 1.55,
              border: m.role === "user" ? "none" : "1px solid var(--border)"
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text3)", fontSize: 13 }}>
              <span style={{ animation: "pulse 1s infinite" }}>●</span> thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about nutrition, goals…"
          style={{
            flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "10px 14px", fontSize: 13, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none"
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          opacity: loading || !input.trim() ? 0.5 : 1
        }}>Send</button>
      </div>
    </div>
  );
}

// Weight chart (canvas)
function WeightChart({ history, dark }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!history.length || !window.Chart) return;
    const isDark = dark;
    const gridColor = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)";
    const textColor = isDark ? "#6B6358" : "#9A9386";
    chartRef.current = new window.Chart(canvasRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: history.map(h => h.date),
        datasets: [{
          data: history.map(h => h.value),
          borderColor: "#D4582A", backgroundColor: "rgba(212,88,42,.08)",
          borderWidth: 2, pointBackgroundColor: "#D4582A",
          pointBorderColor: isDark ? "#1F1D19" : "#fff",
          pointBorderWidth: 2, pointRadius: 5, tension: .4, fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.parsed.y + "kg" } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 11 }, callback: v => v + "kg" } }
        }
      }
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [history, dark]);

  if (!history.length) return <div style={{ textAlign: "center", color: "var(--text3)", padding: "20px 0", fontSize: 13 }}>No weight entries yet</div>;
  return <canvas ref={canvasRef} height={160} style={{ width: "100%" }} />;
}

// Auth page (login + signup)
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) { setError("Please fill all fields"); return; }
    if (mode === "signup" && !name) { setError("Please enter your name"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    try {
      const data = mode === "signup"
        ? await api.signup(name, email, password)
        : await api.login(email, password);
      localStorage.setItem("vt_token", data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "12px 16px", fontSize: 15, color: "var(--text)", fontFamily: "'DM Sans',sans-serif",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 38, color: "var(--text)", marginBottom: 4 }}>Vitals</div>
          <div style={{ fontSize: 13, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Your daily health companion</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, boxShadow: "0 8px 32px rgba(26,24,20,.12)" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg2)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: mode === m ? "var(--surface)" : "transparent",
                color: mode === m ? "var(--text)" : "var(--text3)",
                fontWeight: 600, fontSize: 14, fontFamily: "inherit",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                transition: "all .2s"
              }}>{m === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={inp} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inp}
              onKeyDown={e => e.key === "Enter" && submit()} />
            {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{error}</div>}
            <button onClick={submit} disabled={loading} style={{
              background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10,
              padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              transition: "all .2s", marginTop: 4, opacity: loading ? 0.7 : 1
            }}>{loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}</button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text3)" }}>
        </div>
      </div>
    </div>
  );
}

// ─── Mifflin-St Jeor Calculator ───────────────────────────────────────────────
function calcMifflin({ weight, height, age, gender, activity, goal }) {
  const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age), act = parseFloat(activity);
  const bmr = gender === "male"
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;
  const tdee = Math.round(bmr * act);
  let cal, pro, fat;
  if (goal === "lose") {
    cal = tdee - 400;
    pro = Math.round(w * 2.0);
    fat = Math.round((cal * 0.25) / 9);
  } else {
    cal = tdee + 300;
    pro = Math.round(w * 1.8);
    fat = Math.round((cal * 0.28) / 9);
  }
  return { bmr: Math.round(bmr), tdee, cal: Math.max(cal, 1200), pro, fat };
}

// ─── Onboarding component ─────────────────────────────────────────────────────
function OnboardingPage({ onComplete, dark, setDark }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [form, setForm] = useState({ age: "", gender: "male", weight: "", height: "", activity: "1.55", training: "balanced", targetWeight: "" });
  const [calculated, setCalculated] = useState(null);
  const [manualTargets, setManualTargets] = useState({ cal: 0, pro: 0, fat: 0 });
  const [error, setError] = useState("");

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };
  const sel = { ...inp, cursor: "pointer" };

  function nextStep() {
    setError("");
    if (step === 0 && !goal) { setError("Please select a goal"); return; }
    if (step === 1) {
      if (!form.age || !form.weight || !form.height) { setError("Please fill all fields"); return; }
    }
    if (step === 2) {
      const res = calcMifflin({ ...form, goal });
      setCalculated(res);
      setManualTargets({ cal: res.cal, pro: res.pro, fat: res.fat });
      setStep(3);
      return;
    }
    if (step < 2) setStep(s => s + 1);
  }

  function confirm() {
    onComplete({ goal, profile: form, targets: { cal: Number(manualTargets.cal), pro: Number(manualTargets.pro), fat: Number(manualTargets.fat) } });
  }

  const cardStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 8px 32px rgba(26,24,20,.12)" };
  const nextBtn = { width: "100%", background: "var(--accent)", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "'DM Sans',sans-serif", marginTop: 18, transition: "all .2s" };
  const backBtn = { background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", marginTop: 10, width: "100%", textAlign: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, color: "var(--text)" }}>Vitals</div>
        <div style={{ fontSize: 12, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 4 }}>Your nutrition companion</div>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ height: 6, borderRadius: 99, background: step === i ? "var(--accent)" : "var(--border2)", width: step === i ? 22 : 6, transition: "all .3s" }} />
        ))}
      </div>

      <div style={cardStyle}>
        {/* ── Step 0: Goal ── */}
        {step === 0 && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>What's your goal?</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 22, lineHeight: 1.6 }}>We'll use this to calculate your ideal calorie and macro targets.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { id: "lose", icon: "🔥", label: "Lose Fat", sub: "Caloric deficit" },
                { id: "gain", icon: "💪", label: "Gain Muscle", sub: "Caloric surplus" },
              ].map(g => (
                <div key={g.id} onClick={() => setGoal(g.id)} style={{
                  border: `1.5px solid ${goal === g.id ? "var(--accent)" : "var(--border2)"}`,
                  background: goal === g.id ? "var(--accentBg)" : "var(--surface2)",
                  borderRadius: 12, padding: "18px 14px", cursor: "pointer", textAlign: "center", transition: "all .2s"
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{g.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: goal === g.id ? "var(--accent)" : "var(--text)" }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{g.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Step 1: Basic info ── */}
        {step === 1 && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>About you</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>Used to estimate your base metabolic rate (BMR) via Mifflin-St Jeor.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Age", key: "age", placeholder: "25", type: "number" },
                { label: "Weight (kg)", key: "weight", placeholder: "75", type: "number" },
                { label: "Height (cm)", key: "height", placeholder: "175", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setF(f.key, e.target.value)} style={inp} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Gender</div>
                <select value={form.gender} onChange={e => setF("gender", e.target.value)} style={sel}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Activity ── */}
        {step === 2 && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Your activity level</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>Helps us calculate your TDEE (Total Daily Energy Expenditure).</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Exercise days per week</div>
                <select value={form.activity} onChange={e => setF("activity", e.target.value)} style={sel}>
                  <option value="1.2">Sedentary (0 days / desk job)</option>
                  <option value="1.375">Lightly active (1–2 days)</option>
                  <option value="1.55">Moderately active (3–4 days)</option>
                  <option value="1.725">Very active (5–6 days)</option>
                  <option value="1.9">Athlete (daily intense training)</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Primary training type</div>
                <select value={form.training} onChange={e => setF("training", e.target.value)} style={sel}>
                  <option value="balanced">Balanced (cardio + strength)</option>
                  <option value="strength">Strength / Weight training</option>
                  <option value="cardio">Cardio dominant</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{goal === "lose" ? "Target weight (kg)" : "Goal weight to reach (kg)"}</div>
                <input type="number" placeholder={goal === "lose" ? "e.g. 68" : "e.g. 80"} step="0.1" value={form.targetWeight} onChange={e => setF("targetWeight", e.target.value)} style={inp} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Review + edit targets ── */}
        {step === 3 && calculated && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Your targets</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>Calculated via Mifflin-St Jeor formula — edit any value if you prefer different targets.</div>

            {/* TDEE breakdown */}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "var(--text2)", lineHeight: 2 }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>BMR:</span> {calculated.bmr} kcal &nbsp;·&nbsp;
              <span style={{ fontWeight: 700, color: "var(--text)" }}>TDEE:</span> {calculated.tdee} kcal<br />
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{goal === "lose" ? "Deficit" : "Surplus"}:</span> {Math.abs(calculated.tdee - calculated.cal)} kcal/day &nbsp;·&nbsp;
              <span style={{ fontWeight: 700, color: goal === "lose" ? "var(--green)" : "var(--accent)" }}>
                ~{Math.abs(((calculated.tdee - calculated.cal) * 7) / 7700).toFixed(2)} kg/week {goal === "lose" ? "loss" : "gain"}
              </span>
            </div>

            {/* Editable targets */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
              {[
                { key: "cal", label: "kcal / day", color: "var(--accent)" },
                { key: "pro", label: "Protein (g)", color: "var(--green)" },
                { key: "fat", label: "Fat (g)", color: "var(--amber)" },
              ].map(f => (
                <div key={f.key} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                  <input
                    type="number"
                    value={manualTargets[f.key]}
                    onChange={e => setManualTargets(t => ({ ...t, [f.key]: e.target.value }))}
                    style={{ background: "none", border: "none", fontSize: 22, fontWeight: 700, color: f.color, textAlign: "center", width: "100%", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
                  />
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text3)", fontWeight: 600 }}>{f.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginBottom: 4 }}>Tap any number above to edit manually</div>
          </>
        )}

        {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, background: "var(--accentBg)", padding: "8px 12px", borderRadius: 8, marginTop: 12 }}>{error}</div>}

        <button onClick={step === 3 ? confirm : nextStep} style={nextBtn}>
          {step === 2 ? "Calculate my targets →" : step === 3 ? "Start tracking →" : "Continue →"}
        </button>
        {step > 0 && <button onClick={() => { setError(""); setStep(s => s - 1); }} style={backBtn}>← Back</button>}
      </div>

      <button onClick={() => setDark(d => !d)} style={{ marginTop: 20, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text3)", fontFamily: "'DM Sans',sans-serif" }}>
        {dark ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
      </button>
    </div>
  );
}

// ─── HealthPanel (top-level to prevent remount focus loss) ───────────────────
function HealthPanel({ desktop, water, handleWater, wtHistory, tipIdx, steps, handleSteps }) {
  // Local state so typing doesn't trigger parent re-render and lose focus
  const [localSteps, setLocalSteps] = useState(steps);

  // Sync inward if parent steps changes (e.g. loaded from API)
  useEffect(() => { setLocalSteps(steps); }, [steps]);

  const bmi = wtHistory.length
    ? (wtHistory[wtHistory.length - 1].value / (1.72 * 1.72)).toFixed(1)
    : null;

  return (
    <div style={{ display: desktop ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      <div>
        <Card title="Today's Tip" icon="✨">
          <div style={{ background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 12, padding: "16px", fontSize: 14, color: "var(--accent)", fontWeight: 600, lineHeight: 1.6 }}>
            {HEALTH_TIPS[tipIdx]}
          </div>
        </Card>
        <Card title="Hydration Tracker" icon="💧">
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "var(--blue, #2563EB)" }}>{water}</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>glasses today (goal: 8)</div>
            <ProgBar val={water} max={8} color="#2563EB" />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => handleWater(Math.max(0, water - 1))} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 18, color: "var(--text)" }}>−</button>
            <button onClick={() => handleWater(Math.min(15, water + 1))} style={{ background: "#2563EB", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 18, color: "#fff" }}>+ Glass</button>
          </div>
        </Card>
      </div>
      <div>
        {bmi && (
          <Card title="BMI Estimate" icon="📊">
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: parseFloat(bmi) < 18.5 ? "var(--blue, #2563EB)" : parseFloat(bmi) < 25 ? "var(--green)" : "var(--amber)" }}>{bmi}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
                {parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal weight ✓" : parseFloat(bmi) < 30 ? "Overweight" : "Obese"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Based on latest weight · 172cm assumed</div>
            </div>
          </Card>
        )}
        <Card title="Steps Tracker" icon="🚶">
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="number"
              value={localSteps}
              placeholder="Enter steps today"
              onChange={e => setLocalSteps(e.target.value)}
              onBlur={e => handleSteps(e.target.value)}
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
            />
          </div>
          {localSteps > 0 && (
            <div>
              <ProgBar val={parseInt(localSteps)} max={10000} color="var(--green)" />
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>
                {parseInt(localSteps) >= 10000 ? "🎉 Goal of 10,000 steps reached!" : `${(10000 - parseInt(localSteps)).toLocaleString()} more steps to goal`}
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                ≈ {Math.round(parseInt(localSteps) * 0.04)} kcal burned
              </div>
            </div>
          )}
        </Card>
        <Card title="All Health Tips" icon="📋" defaultOpen={false}>
          {HEALTH_TIPS.map((tip, i) => (
            <div key={i} style={{ fontSize: 13, color: "var(--text2)", padding: "8px 0", borderBottom: i < HEALTH_TIPS.length - 1 ? "1px solid var(--border)" : "none" }}>{tip}</div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Main app (post-login) ────────────────────────────────────────────────────
function MainApp({ user, onLogout, dark, setDark, userTargets, userGoal, userProfile, onResetGoal }) {
  const TARGETS = userTargets || DEFAULT_TARGETS;
  const [items, setItems] = useState({});
  const [wholeEggs, setWholeEggs] = useState(0);
  const [eggWhites, setEggWhites] = useState(0);
  const [customFoods, setCustomFoods] = useState([]);
  const [presetFoods, setPresetFoods] = useState(() => store.get("vt_preset_foods", FOODS));
  const [wtInput, setWtInput] = useState("");
  const [wtHistory, setWtHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("tracker");
  const [tipIdx] = useState(() => Math.floor(Math.random() * HEALTH_TIPS.length));
  const [quoteIdx] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const syncTimer = useRef(null);

  const macros = calcMacros(items, wholeEggs, eggWhites, customFoods, presetFoods);  const rCal = TARGETS.cal - macros.cal;
  const rPro = TARGETS.pro - macros.pro;
  const rFat = TARGETS.fat - macros.fat;

  // ── Load all data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      setLoadingData(true);
      try {
        const [log, weight, foods] = await Promise.all([
          api.getLog(),
          api.getWeight(),
          api.getCustomFoods(),
        ]);
        setItems(log.items || {});
        setWholeEggs(log.wholeEggs || 0);
        setEggWhites(log.eggWhites || 0);
        setWater(log.water || 0);
        setSteps(log.steps || "");
        setWtHistory(weight);
        setCustomFoods(foods);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadAll();
  }, []);

  // ── Debounced log save ──────────────────────────────────────────────────────
  function scheduleSave(patch) {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    setSyncing(true);
    syncTimer.current = setTimeout(async () => {
      try { await api.saveLog(patch); } catch (e) { console.error("Save error:", e); }
      setSyncing(false);
    }, 800);
  }

  function toggleItem(id) {
    setItems(prev => {
      const next = { ...prev, [id]: !prev[id] };
      scheduleSave({ items: next });
      return next;
    });
  }
  function handleWholeEggs(v) { setWholeEggs(v); scheduleSave({ wholeEggs: v }); }
  function handleEggWhites(v) { setEggWhites(v); scheduleSave({ eggWhites: v }); }
  function handleWater(v) { setWater(v); scheduleSave({ water: v }); }
  function handleSteps(v) { setSteps(v); scheduleSave({ steps: v }); }

  async function addCustomFood(food) {
    try {
      const saved = await api.addCustomFood(food);
      setCustomFoods(prev => [saved, ...prev]);
    } catch (err) { console.error("Add food error:", err); }
  }

  function deletePresetFood(id) {
    setPresetFoods(prev => {
      const next = prev.filter(f => f.id !== id);
      store.set("vt_preset_foods", next);
      return next;
    });
    setItems(prev => { const next = { ...prev }; delete next[id]; scheduleSave({ items: next }); return next; });
  }

  function resetPresetFoods() {
    setPresetFoods(FOODS);
    store.set("vt_preset_foods", FOODS);
  }

  // Weight projection using Mifflin + current targets
  function calcProjections() {
    if (!userProfile?.weight || !userProfile?.height || !userProfile?.age) return null;
    const { bmr, tdee } = calcMifflin({ ...userProfile, goal: userGoal });
    const dailyDiff = TARGETS.cal - tdee;
    const weeklyKg = (dailyDiff * 7) / 7700;
    const curWeight = parseFloat(userProfile.weight);
    return [
      { label: "1 Week",   weeks: 1 },
      { label: "2 Weeks",  weeks: 2 },
      { label: "1 Month",  weeks: 4.33 },
      { label: "2 Months", weeks: 8.66 },
      { label: "3 Months", weeks: 13 },
      { label: "6 Months", weeks: 26 },
    ].map(p => {
      const change = weeklyKg * p.weeks;
      return { label: p.label, change: change.toFixed(1), projected: (curWeight + change).toFixed(1) };
    });
  }
  async function toggleCustomFood(id) {
    setCustomFoods(prev => {
      const next = prev.map(f => f.id?.toString() === id.toString() || f._id?.toString() === id.toString()
        ? { ...f, checked: !f.checked } : f);
      const food = next.find(f => f.id?.toString() === id.toString() || f._id?.toString() === id.toString());
      if (food) api.toggleCustomFood(id, food.checked).catch(console.error);
      return next;
    });
  }
  async function deleteCustomFood(id) {
    setCustomFoods(prev => prev.filter(f => f.id?.toString() !== id.toString() && f._id?.toString() !== id.toString()));
    api.deleteCustomFood(id).catch(console.error);
  }

  async function logWeight() {
    const v = parseFloat(wtInput);
    if (!v) return;
    try {
      const entry = await api.logWeight(v);
      setWtHistory(prev => [...prev, entry]);
      setWtInput("");
    } catch (err) { console.error("Weight log error:", err); }
  }

  function weightPrediction() {
    if (wtHistory.length < 2) return null;
    const first = wtHistory[0].value, last = wtHistory[wtHistory.length - 1].value;
    const rate = (first - last) / wtHistory.length;
    if (rate <= 0) return "No downward trend yet — keep going!";
    const days = Math.ceil((last - 68) / rate);
    return `Reach 68kg in ~${days} day${days === 1 ? "" : "s"} at this pace`;
  }

  // Build suggestion
  function getSuggestion() {
    if (rPro > 25 && rFat < 10) return "Add Whey Protein or Egg Whites for protein 💪";
    if (rPro > 20 && rFat > 10) return "Have some Soya or Moong Dal 🫘";
    if (rFat > 20) return "Skip Paneer today, try egg whites 🧀";
    if (macros.cal >= TARGETS.cal && macros.pro >= TARGETS.pro) return "All goals met — amazing job! 🌿";
    return "Keep logging to hit your targets!";
  }

  const sections = ["Milk", "Grains & Protein", "Paneer", "Dal", "Soya"];
  const pred = weightPrediction();

  // ── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
  const [desktop, setDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const fn = () => setDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn);
  }, []);

  const navTabs = [
    { id: "tracker", icon: "🥗", label: "Tracker" },
    { id: "weight",  icon: "⚖️", label: "Weight" },
    { id: "health",  icon: "❤️", label: "Health" },
    { id: "ai",      icon: "🤖", label: "AI Coach" },
  ];

  // Sidebar nav (desktop)
  function Sidebar() {
    return (
      <div style={{
        width: 220, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0
      }}>
        <div style={{ padding: "28px 24px 20px" }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "var(--text)" }}>Vitals</div>
          <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>Daily Tracker</div>
        </div>
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navTabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
              borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: activeTab === t.id ? "var(--accentBg)" : "transparent",
              color: activeTab === t.id ? "var(--accent)" : "var(--text2)",
              fontWeight: activeTab === t.id ? 700 : 500, fontSize: 14, marginBottom: 2,
              transition: "all .2s", textAlign: "left"
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>{user.email}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setDark(d => !d)} style={{
              flex: 1, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8,
              padding: "7px 0", cursor: "pointer", fontSize: 14, color: "var(--text2)"
            }}>{dark ? "☀️" : "🌙"}</button>
            <button onClick={onLogout} style={{
              flex: 1, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8,
              padding: "7px 6px", cursor: "pointer", fontSize: 12, color: "var(--text3)", fontFamily: "inherit"
            }}>Logout</button>
          </div>
          <button onClick={onResetGoal} style={{
            width: "100%", marginTop: 8, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 8,
            padding: "8px 0", cursor: "pointer", fontSize: 12, color: "var(--accent)", fontFamily: "inherit", fontWeight: 600
          }}>⚙ Edit Goals & Targets</button>
        </div>
      </div>
    );
  }

  // Bottom nav (mobile)
  function BottomNav() {
    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface)",
        borderTop: "1px solid var(--border)", display: "flex", padding: "8px 0 12px", zIndex: 100
      }}>
        {navTabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            color: activeTab === t.id ? "var(--accent)" : "var(--text3)"
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>{t.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // ── Content panels ──────────────────────────────────────────────────────────

  const [showAddModal, setShowAddModal] = useState(false);

  function TrackerPanel() {
    return (
      <>
        {showAddModal && <AddFoodModal onAdd={addCustomFood} onClose={() => setShowAddModal(false)} />}
        <div style={{ display: desktop ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          {/* Left col */}
          <div>
            {/* Summary */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: "0 1px 3px rgba(26,24,20,.06),0 4px 16px rgba(26,24,20,.08)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <MacroPill val={macros.cal} unit="" label="kcal" rem={rCal > 0 ? rCal + " left" : "✓ Met!"} color="var(--accent)" />
                <MacroPill val={macros.pro} unit="g" label="protein" rem={rPro > 0 ? rPro.toFixed(0) + "g left" : "✓ Met!"} color="var(--green)" />
                <MacroPill val={macros.fat} unit="g" label="fat" rem={rFat > 0 ? rFat.toFixed(0) + "g left" : "✓ Met!"} color="var(--amber)" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  { label: "Calories", val: macros.cal, max: TARGETS.cal, color: "var(--accent)" },
                  { label: "Protein",  val: macros.pro, max: TARGETS.pro, color: "var(--green)" },
                  { label: "Fat",      val: macros.fat, max: TARGETS.fat, color: "var(--amber)" },
                ].map(p => (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, width: 60, flexShrink: 0 }}>{p.label}</span>
                    <ProgBar val={p.val} max={p.max} color={p.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Motivation bar */}
            <div style={{ background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 10, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--accent)", fontWeight: 500, fontStyle: "italic", lineHeight: 1.5 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>✨</span>
              <span>"{MOTIVATIONAL_QUOTES[quoteIdx]}"</span>
            </div>

            {/* Food card */}
            <Card title="Food" icon="🥗">
              {sections.filter(sec => presetFoods.some(f => f.section === sec)).map(sec => {
                const secFoods = presetFoods.filter(f => f.section === sec);
                return (
                  <div key={sec}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", margin: "12px 0 8px" }}>{sec}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {secFoods.map(f => (
                        <div key={f.id} style={{ position: "relative" }}>
                          <FoodChip food={f} checked={!!items[f.id]} onToggle={() => toggleItem(f.id)} />
                          <button onClick={() => deletePresetFood(f.id)} title="Remove food" style={{
                            position: "absolute", top: 4, right: 4, background: "var(--bg3)", border: "none",
                            borderRadius: 99, width: 18, height: 18, cursor: "pointer", fontSize: 9,
                            color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center",
                            lineHeight: 1, zIndex: 2, transition: "all .15s"
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {presetFoods.length === 0 && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>All preset foods removed.</div>
                  <button onClick={resetPresetFoods} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, color: "var(--text2)", fontFamily: "inherit" }}>↺ Restore presets</button>
                </div>
              )}
              {presetFoods.length > 0 && (
                <button onClick={resetPresetFoods} style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text3)", fontFamily: "inherit", textDecoration: "underline" }}>↺ Restore all preset foods</button>
              )}
            </Card>

            {/* Custom Foods card */}
            <Card title="My Custom Foods" icon="✏️">
              <button onClick={() => setShowAddModal(true)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "var(--accentBg)", border: "1.5px dashed var(--accent)", borderRadius: 10,
                padding: "11px 0", cursor: "pointer", fontSize: 13, fontWeight: 700,
                color: "var(--accent)", fontFamily: "inherit", marginBottom: customFoods.length ? 12 : 0,
                transition: "all .2s"
              }}>
                ➕ Add Custom Food
              </button>
              {customFoods.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {customFoods.map(f => (
                    <CustomFoodChip
                      key={f.id}
                      food={f}
                      onToggle={() => toggleCustomFood(f.id)}
                      onDelete={() => deleteCustomFood(f.id)}
                    />
                  ))}
                </div>
              )}
              {customFoods.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 12, paddingTop: 10 }}>
                  No custom foods yet — add your own meals above!
                </div>
              )}
            </Card>
          </div>

          {/* Right col */}
          <div>
            {/* Eggs */}
            <Card title="Eggs" icon="🥚">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Whole Eggs", val: wholeEggs, set: handleWholeEggs, sub: "70kcal · 6g P · 5g F each" },
                  { label: "Egg Whites", val: eggWhites, set: handleEggWhites, sub: "17kcal · 3.6g P · 0g F each" },
                ].map(e => (
                  <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{e.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{e.sub}</div>
                    </div>
                    <Stepper val={e.val} onChange={e.set} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Projections card */}
            <Card title="Weight Projection" icon="📈" defaultOpen={true}>
              {(() => {
                const projections = calcProjections();
                if (!projections) return (
                  <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", padding: "12px 0" }}>
                    Complete your goal setup to see projections.<br />
                    <button onClick={onResetGoal} style={{ marginTop: 8, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, color: "var(--accent)", fontFamily: "inherit" }}>⚙ Set Goals</button>
                  </div>
                );
                return (
                  <>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
                      Based on your {TARGETS.cal} kcal/day target vs your TDEE
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {projections.map((p, i) => {
                        const isLoss = parseFloat(p.change) < 0;
                        const isGood = userGoal === "lose" ? isLoss : !isLoss;
                        return (
                          <div key={i} style={{
                            background: isGood ? "var(--greenBg)" : "var(--accentBg)",
                            border: `1px solid ${isGood ? "var(--green)" : "var(--accent)"}`,
                            borderRadius: 10, padding: "12px",
                          }}>
                            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{p.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: isGood ? "var(--green)" : "var(--accent)", lineHeight: 1, marginBottom: 3 }}>
                              {parseFloat(p.change) > 0 ? "+" : ""}{p.change} kg
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text3)" }}>→ {p.projected} kg</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </Card>
          </div>
        </div>
      </>
    );
  }

  function WeightPanel() {
    return (
      <div style={{ display: desktop ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Card title="Log Weight" icon="⚖️">
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={wtInput} onChange={e => setWtInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && logWeight()}
              placeholder="Weight in kg" type="number" step="0.1"
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 15, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
            />
            <button onClick={logWeight} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Log</button>
          </div>
          <WeightChart history={wtHistory} dark={dark} />
          {pred && (
            <div style={{ background: "var(--greenBg)", border: "1px solid var(--green)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--green)", fontWeight: 600, marginTop: 10, display: "flex", alignItems: "center", gap: 7 }}>
              <span>🎯</span><span>{pred}</span>
            </div>
          )}
        </Card>
        <Card title="Weight History" icon="📅">
          {wtHistory.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text3)", padding: "20px 0", fontSize: 13 }}>No entries yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...wtHistory].reverse().slice(0, 10).map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>{h.date}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{h.value} kg</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  const healthPanelProps = { desktop, water, handleWater, wtHistory, tipIdx, steps, handleSteps };
  

  function AIPanel() {
    return (
      <Card title="AI Health Coach" icon="🤖">
        <AIChatbot />
      </Card>
    );
  }

  const panels = { tracker: <TrackerPanel />, weight: <WeightPanel />, health: <HealthPanel {...healthPanelProps} />, ai: <AIPanel /> };

  if (loadingData) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: "var(--text)" }}>Vitals</div>
        <div style={{ fontSize: 13, color: "var(--text3)" }}>Loading your data…</div>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--bg3)", overflow: "hidden" }}>
          <div style={{ width: "60%", height: "100%", background: "var(--accent)", borderRadius: 99, animation: "pulse 1.2s ease-in-out infinite" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {desktop && <Sidebar />}
      <div style={{ flex: 1, overflowY: "auto", padding: desktop ? "28px 32px" : "20px 16px 80px" }}>
        {!desktop && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: "var(--text)" }}>Vitals</div>
              <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Hi, {user.name}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {syncing && <span style={{ fontSize: 11, color: "var(--text3)", animation: "pulse 1s infinite" }}>saving…</span>}
              <button onClick={onResetGoal} style={{ background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 40, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "var(--accent)", fontFamily: "inherit", fontWeight: 600 }}>
                ⚙ Goals
              </button>
              <button onClick={() => setDark(d => !d)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 40, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "var(--text2)", fontFamily: "inherit" }}>
                {dark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
        )}
        {desktop && (
          <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
                {navTabs.find(t => t.id === activeTab)?.icon} {navTabs.find(t => t.id === activeTab)?.label}
              </div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>Welcome back, {user.name}</div>
            </div>
            {syncing && <span style={{ fontSize: 12, color: "var(--text3)", animation: "pulse 1s infinite" }}>☁️ Saving…</span>}
          </div>
        )}
        {panels[activeTab]}
      </div>
      {!desktop && <BottomNav />}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => { try { return JSON.parse(localStorage.getItem("vt_dark")) ?? false; } catch { return false; } });
  const [authChecking, setAuthChecking] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem("vt_targets"));
  const [userTargets, setUserTargets] = useState(() => store.get("vt_targets", DEFAULT_TARGETS));
  const [userGoal, setUserGoal] = useState(() => localStorage.getItem("vt_goal") || "lose");
  const [userProfile, setUserProfile] = useState(() => store.get("vt_profile", null));

  // Restore session from saved token
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("vt_token");
      if (!token) { setAuthChecking(false); return; }
      try {
        const data = await api.me();
        setUser(data.user);
      } catch {
        localStorage.removeItem("vt_token");
      } finally {
        setAuthChecking(false);
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    localStorage.setItem("vt_dark", JSON.stringify(dark));
    const t = dark ? DARK : LIGHT;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => {
      const cssKey = "--" + k.replace(/([A-Z])/g, m => "-" + m.toLowerCase());
      root.style.setProperty(cssKey, v);
    });
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
    // Update spinner colors for dark/light
    const existingSpinner = document.getElementById("vt-spinner");
    if (existingSpinner) existingSpinner.remove();
    const sp = document.createElement("style");
    sp.id = "vt-spinner";
    sp.textContent = dark
      ? `input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{background:#3A362D;filter:invert(1) brightness(2);border-radius:3px;}`
      : `input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{background:#E4E0D6;filter:none;border-radius:3px;}`;
    document.head.appendChild(sp);
  }, [dark]);

  // Inject fonts + global styles once
  useEffect(() => {
    if (!document.getElementById("vt-fonts")) {
      const l = document.createElement("link");
      l.id = "vt-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
    if (!document.getElementById("vt-global")) {
      const s = document.createElement("style");
      s.id = "vt-global";
      s.textContent = `
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.5;transition:background .25s,color .25s}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{
          opacity:1;
          background:var(--surface3,#2A2D31);
          border-radius:4px;
          cursor:pointer;
        }
      `;
      document.head.appendChild(s);
    }
    // ── Dark mode spinner fix — re-inject when dark changes ──
    const existingSpinner = document.getElementById("vt-spinner");
    if (existingSpinner) existingSpinner.remove();
    const sp = document.createElement("style");
    sp.id = "vt-spinner";
    sp.textContent = dark
      ? `input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{background:#3A362D;filter:invert(1) brightness(1.8);}`
      : `input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{background:#E4E0D6;filter:none;}`;
    document.head.appendChild(sp);
    // ── Favicon "V" ──
    if (!document.getElementById("vt-favicon")) {
      const canvas = document.createElement("canvas");
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#D4582A";
      ctx.beginPath();
      ctx.roundRect(0, 0, 32, 32, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px 'DM Serif Display', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("V", 16, 17);
      const link = document.createElement("link");
      link.id = "vt-favicon";
      link.rel = "icon";
      link.href = canvas.toDataURL();
      document.head.appendChild(link);
    }
    if (!document.getElementById("chartjs")) {
      const sc = document.createElement("script");
      sc.id = "chartjs"; sc.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
      document.head.appendChild(sc);
    }
  }, []);

  function handleAuth(u) { setUser(u); }
  function handleLogout() { setUser(null); localStorage.removeItem("vt_token"); }

  function handleOnboardingComplete({ goal, profile, targets }) {
    setUserGoal(goal);
    setUserProfile(profile);
    setUserTargets(targets);
    localStorage.setItem("vt_goal", goal);
    store.set("vt_profile", profile);
    store.set("vt_targets", targets);
    setOnboardingDone(true);
  }

  function handleResetGoal() {
    setOnboardingDone(false);
  }

  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: "var(--text)" }}>Vitals</div>
      </div>
    );
  }

  if (!user) return <AuthPage onAuth={handleAuth} />;
  if (!onboardingDone) return <OnboardingPage onComplete={handleOnboardingComplete} dark={dark} setDark={setDark} />;
  return (
    <MainApp
      user={user}
      onLogout={handleLogout}
      dark={dark}
      setDark={setDark}
      userTargets={userTargets}
      userGoal={userGoal}
      userProfile={userProfile}
      onResetGoal={handleResetGoal}
    />
  );
}
