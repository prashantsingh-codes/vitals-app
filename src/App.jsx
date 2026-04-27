import { useState, useEffect, useRef, useCallback } from "react";

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
const TARGETS = { cal: 1800, pro: 130, fat: 55 };
const MACROS = {
  milk:     { cal: 85,  pro: 6,  fat: 3,   label: "Milk" },
  oats:     { cal: 115, pro: 4,  fat: 2,   label: "Oats" },
  whey:     { cal: 120, pro: 24, fat: 1,   label: "Whey" },
  rice:     { cal: 200, pro: 4,  fat: 0.5, label: "Rice" },
  paneer50: { cal: 90,  pro: 10, fat: 4,   label: "Paneer 50g" },
  paneer100:{ cal: 180, pro: 20, fat: 8,   label: "Paneer 100g" },
  dal:      { cal: 180, pro: 10, fat: 3,   label: "Dal" },
  soya:     { cal: 300, pro: 25, fat: 14,  label: "Soya Chunks" },
  wholeEgg: { cal: 70,  pro: 6,  fat: 5,   label: "Whole Egg" },
  eggWhite: { cal: 17,  pro: 3.6,fat: 0,   label: "Egg White" },
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

// Veg/egg alternative suggestions
const ALT_SUGGESTIONS = [
  { name: "Tofu scramble", cal: 120, pro: 12, fat: 6,  tag: "🥚 veg" },
  { name: "Moong dal chilla", cal: 140, pro: 10, fat: 3, tag: "🫘 veg" },
  { name: "Paneer bhurji", cal: 160, pro: 14, fat: 9, tag: "🧀 veg" },
  { name: "Boiled chickpeas", cal: 180, pro: 9,  fat: 3, tag: "🫘 veg" },
  { name: "Greek yogurt bowl", cal: 100, pro: 10, fat: 3, tag: "🥛 veg" },
  { name: "Egg white omelette", cal: 60,  pro: 12, fat: 1, tag: "🥚 egg" },
];

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

function calcMacros(items, wholeEggs, eggWhites) {
  let cal = 0, pro = 0, fat = 0;
  FOODS.forEach(f => { if (items[f.id]) { cal += MACROS[f.key].cal; pro += MACROS[f.key].pro; fat += MACROS[f.key].fat; } });
  cal += wholeEggs * MACROS.wholeEgg.cal + eggWhites * MACROS.eggWhite.cal;
  pro += wholeEggs * MACROS.wholeEgg.pro + eggWhites * MACROS.eggWhite.pro;
  fat += wholeEggs * MACROS.wholeEgg.fat;
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

// AI Chatbot
function AIChatbot({ t }) {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hi! I'm your Vitals AI coach 🌿 Ask me anything about nutrition, fitness, or your health goals!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    const q = input.trim();
    if (!q) return;
    const newMsgs = [...msgs, { role: "user", text: q }];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.text }))
        })
      });
      const data = await res.json();
      const reply = data.content?.find(c => c.type === "text")?.text || "Sorry, I couldn't respond right now.";
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
              maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
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
function AuthPage({ onAuth, t }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!email || !password) { setError("Please fill all fields"); return; }
    if (mode === "signup" && !name) { setError("Please enter your name"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    const users = store.get("vt_users", {});
    if (mode === "signup") {
      if (users[email]) { setError("Account already exists"); return; }
      users[email] = { name, password };
      store.set("vt_users", users);
      onAuth({ email, name });
    } else {
      if (!users[email] || users[email].password !== password) { setError("Invalid email or password"); return; }
      onAuth({ email, name: users[email].name });
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
            <button onClick={submit} style={{
              background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10,
              padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              transition: "all .2s", marginTop: 4
            }}>{mode === "login" ? "Log In" : "Create Account"}</button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text3)" }}>
          Credentials stored locally on this device
        </div>
      </div>
    </div>
  );
}

// ─── Main app (post-login) ────────────────────────────────────────────────────
function MainApp({ user, onLogout, dark, setDark }) {
  const [items, setItems] = useState(() => store.get("vt_items", {}));
  const [wholeEggs, setWholeEggs] = useState(() => store.get("vt_weggs", 0));
  const [eggWhites, setEggWhites] = useState(() => store.get("vt_ewh", 0));
  const [wtInput, setWtInput] = useState("");
  const [wtHistory, setWtHistory] = useState(() => store.get("vt_wth", []));
  const [activeTab, setActiveTab] = useState("tracker");
  const [tipIdx] = useState(() => Math.floor(Math.random() * HEALTH_TIPS.length));
  const [water, setWater] = useState(() => store.get("vt_water", 0));
  const [steps, setSteps] = useState(() => store.get("vt_steps", ""));

  const macros = calcMacros(items, wholeEggs, eggWhites);
  const rCal = TARGETS.cal - macros.cal;
  const rPro = TARGETS.pro - macros.pro;
  const rFat = TARGETS.fat - macros.fat;

  useEffect(() => { store.set("vt_items", items); }, [items]);
  useEffect(() => { store.set("vt_weggs", wholeEggs); }, [wholeEggs]);
  useEffect(() => { store.set("vt_ewh", eggWhites); }, [eggWhites]);
  useEffect(() => { store.set("vt_water", water); }, [water]);

  function toggleItem(id) { setItems(prev => ({ ...prev, [id]: !prev[id] })); }

  function logWeight() {
    const v = parseFloat(wtInput);
    if (!v) return;
    const entry = { date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: v };
    const nh = [...wtHistory, entry];
    setWtHistory(nh); store.set("vt_wth", nh); setWtInput("");
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

  function TrackerPanel() {
    return (
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

          {/* Suggestion bar */}
          <div style={{ background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
            <span>💡</span><span>{getSuggestion()}</span>
          </div>

          {/* Food card */}
          <Card title="Food" icon="🥗">
            {sections.map(sec => {
              const foods = FOODS.filter(f => f.section === sec);
              return (
                <div key={sec}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", margin: "12px 0 8px" }}>{sec}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {foods.map(f => <FoodChip key={f.id} food={f} checked={!!items[f.id]} onToggle={() => toggleItem(f.id)} />)}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Right col */}
        <div>
          {/* Eggs */}
          <Card title="Eggs" icon="🥚">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Whole Eggs", val: wholeEggs, set: setWholeEggs, sub: "70kcal · 6g P · 5g F each" },
                { label: "Egg Whites", val: eggWhites, set: setEggWhites, sub: "17kcal · 3.6g P · 0g F each" },
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

          {/* Alternatives */}
          <Card title="Alternatives to Hit Target" icon="🌱" defaultOpen={false}>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>5–6 veg/egg options to complete your macros:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ALT_SUGGESTIONS.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px"
                }}>
                  <span style={{ fontSize: 20 }}>{a.tag.split(" ")[0]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.cal}kcal · {a.pro}g P · {a.fat}g F</div>
                  </div>
                  <span style={{ fontSize: 11, background: "var(--accentBg)", color: "var(--accent)", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>{a.tag.split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
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

  function HealthPanel() {
    const bmi = wtHistory.length ? (wtHistory[wtHistory.length - 1].value / (1.72 * 1.72)).toFixed(1) : null;
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
              <div style={{ fontSize: 12, color: "var(--text3)" }}>glasses of 8 today (goal: 8)</div>
              <ProgBar val={water} max={8} color="#2563EB" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => setWater(w => Math.max(0, w - 1))} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 18, color: "var(--text)" }}>−</button>
              <button onClick={() => setWater(w => Math.min(15, w + 1))} style={{ background: "#2563EB", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 18, color: "#fff" }}>+ Glass</button>
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
              <input value={steps} onChange={e => setSteps(e.target.value)} placeholder="Enter steps today"
                type="number"
                style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
              />
            </div>
            {steps > 0 && (
              <div>
                <ProgBar val={parseInt(steps)} max={10000} color="var(--green)" />
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>
                  {parseInt(steps) >= 10000 ? "🎉 Goal of 10,000 steps reached!" : `${(10000 - parseInt(steps)).toLocaleString()} more steps to goal`}
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                  ≈ {Math.round(parseInt(steps) * 0.04)} kcal burned
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

  function AIPanel() {
    return (
      <Card title="AI Health Coach" icon="🤖">
        <AIChatbot />
      </Card>
    );
  }

  const panels = { tracker: <TrackerPanel />, weight: <WeightPanel />, health: <HealthPanel />, ai: <AIPanel /> };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {desktop && <Sidebar />}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: desktop ? "28px 32px" : "20px 16px 80px",
      }}>
        {!desktop && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: "var(--text)" }}>Vitals</div>
              <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Hi, {user.name}</div>
            </div>
            <button onClick={() => setDark(d => !d)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 40, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "var(--text2)", fontFamily: "inherit" }}>
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        )}
        {desktop && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
              {navTabs.find(t => t.id === activeTab)?.icon} {navTabs.find(t => t.id === activeTab)?.label}
            </div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>Welcome back, {user.name}</div>
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
  const [user, setUser] = useState(() => store.get("vt_user", null));
  const [dark, setDark] = useState(() => store.get("vt_dark", false));

  useEffect(() => {
    store.set("vt_dark", dark);
    const t = dark ? DARK : LIGHT;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => {
      const cssKey = "--" + k.replace(/([A-Z])/g, m => "-" + m.toLowerCase());
      root.style.setProperty(cssKey, v);
    });
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
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
      s.textContent = `*{box-sizing:border-box;margin:0;padding:0} body{font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.5;transition:background .25s,color .25s} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`;
      document.head.appendChild(s);
    }
    if (!document.getElementById("chartjs")) {
      const sc = document.createElement("script");
      sc.id = "chartjs"; sc.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
      document.head.appendChild(sc);
    }
  }, []);

  function handleAuth(u) { setUser(u); store.set("vt_user", u); }
  function handleLogout() { setUser(null); store.set("vt_user", null); }

  if (!user) return <AuthPage onAuth={handleAuth} />;
  return <MainApp user={user} onLogout={handleLogout} dark={dark} setDark={setDark} />;
}
