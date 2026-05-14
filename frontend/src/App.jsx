import { useState, useEffect, useRef } from "react";
import { api } from "./api/api.js";
import AuthPage from "./pages/AuthPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

// ─── Design tokens ─────────────────────────────────────────────────────────
const LIGHT = { bg:"#F7F5F0",bg2:"#EEEBE3",bg3:"#E4E0D6",surface:"#FFFFFF",surface2:"#F7F5F0",text:"#1A1814",text2:"#5C5849",text3:"#9A9386",accent:"#D4582A",accent2:"#E8835C",accentBg:"#FBE9E2",border:"#D9D4C7",border2:"#C9C3B3",green:"#2D7A5C",greenBg:"#E6F4EE",amber:"#B8861A",amberBg:"#FBF3E0",blue:"#2563EB",blueBg:"#EFF6FF" };
const DARK  = { bg:"#141210",bg2:"#1C1A17",bg3:"#242119",surface:"#1F1D19",surface2:"#252219",text:"#F0EDE6",text2:"#A89F8E",text3:"#6B6358",accent:"#E8835C",accent2:"#D4582A",accentBg:"#2A1C14",border:"#2E2B24",border2:"#3A362D",green:"#4CAF85",greenBg:"#0F2319",amber:"#D4A435",amberBg:"#221B0A",blue:"#60A5FA",blueBg:"#1E3A5F" };

const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const DEFAULT_TARGETS = { cal: 1800, pro: 130, fat: 55 };

export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => { try { return JSON.parse(localStorage.getItem("vt_dark")) ?? false; } catch { return false; } });
  const [authChecking, setAuthChecking] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem("vt_targets"));
  const [userTargets, setUserTargets] = useState(() => store.get("vt_targets", DEFAULT_TARGETS));
  const [userGoal, setUserGoal] = useState(() => localStorage.getItem("vt_goal") || "lose");
  const [userProfile, setUserProfile] = useState(() => store.get("vt_profile", null));
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  const [serverPresetFoods, setServerPresetFoods] = useState(null);
  const [serverPermDeletedPromoted, setServerPermDeletedPromoted] = useState([]);
  const [serverEverPromoted, setServerEverPromoted] = useState([]);
  const [serverPermDeletedPresets, setServerPermDeletedPresets] = useState([]);

  // Apply theme tokens to CSS variables
  useEffect(() => {
    localStorage.setItem("vt_dark", JSON.stringify(dark));
    const t = dark ? DARK : LIGHT;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => {
      const cssKey = "--" + k.replace(/([A-Z])/g, (m) => "-" + m.toLowerCase());
      root.style.setProperty(cssKey, v);
    });
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
    // spinner colour follows theme
    const existingSpinner = document.getElementById("vt-spinner");
    if (existingSpinner) existingSpinner.remove();
    const sp = document.createElement("style");
    sp.id = "vt-spinner";
    sp.textContent = dark
      ? `input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{background:#3A362D;filter:invert(1) brightness(2);border-radius:3px;}`
      : `input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{background:#E4E0D6;filter:none;border-radius:3px;}`;
    document.head.appendChild(sp);
  }, [dark]);

  // Load fonts, global styles, Chart.js, favicon
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
      s.textContent = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.5;transition:background .25s,color .25s}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1;background:var(--surface3,#2A2D31);border-radius:4px;cursor:pointer;}`;
      document.head.appendChild(s);
    }
    if (!document.getElementById("vt-favicon")) {
      const canvas = document.createElement("canvas");
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#D4582A";
      ctx.beginPath(); ctx.roundRect(0, 0, 32, 32, 8); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px 'DM Serif Display', serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("V", 16, 17);
      const link = document.createElement("link");
      link.id = "vt-favicon"; link.rel = "icon"; link.href = canvas.toDataURL();
      document.head.appendChild(link);
    }
    if (!document.getElementById("chartjs")) {
      const sc = document.createElement("script");
      sc.id = "chartjs";
      sc.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
      document.head.appendChild(sc);
    }
  }, []);

  // Restore session
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("vt_token");
      if (!token) { setAuthChecking(false); return; }
      try { const data = await api.me(); setUser(data.user); } catch { localStorage.removeItem("vt_token"); } finally { setAuthChecking(false); }
    }
    restoreSession();
  }, []);

  // Load profile from server after login
  useEffect(() => {
    if (!user) return;
    api.getProfile().then((data) => {
      if (data && data.targets) {
        setUserGoal(data.goal);
        setUserProfile(data.profile);
        setUserTargets(data.targets);
        localStorage.setItem("vt_goal", data.goal);
        store.set("vt_profile", data.profile);
        store.set("vt_targets", data.targets);
        setOnboardingDone(true);
      }
      if (data.presetFoods) { setServerPresetFoods(data.presetFoods); store.set("vt_preset_foods", data.presetFoods); }
      if (data.permDeletedPromoted) { setServerPermDeletedPromoted(data.permDeletedPromoted); }
      if (data.everPromoted) { setServerEverPromoted(data.everPromoted); }
      if (data.permDeletedPresets) { setServerPermDeletedPresets(data.permDeletedPresets); }
    }).catch(console.error);
  }, [user]);

  function handleAuth(u) { setUser(u); }
  function handleLogout() { setUser(null); localStorage.removeItem("vt_token"); }

  function handleOnboardingComplete({ goal, profile, targets }) {
    setUserGoal(goal); setUserProfile(profile); setUserTargets(targets);
    localStorage.setItem("vt_goal", goal);
    store.set("vt_profile", profile);
    store.set("vt_targets", targets);
    setOnboardingDone(true); setIsEditingGoals(false);
    api.saveProfile({ goal, profile, targets }).catch(console.error);
  }

  function handleResetGoal() { setIsEditingGoals(true); setOnboardingDone(false); }
  function handleCancelEdit() { setIsEditingGoals(false); setOnboardingDone(true); }

  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: "var(--text)" }}>Vitals</div>
      </div>
    );
  }

  if (!user) return <AuthPage onAuth={handleAuth} />;
  if (!onboardingDone) return <OnboardingPage onComplete={handleOnboardingComplete} dark={dark} setDark={setDark} isEditingGoals={isEditingGoals} onCancelEdit={handleCancelEdit} />;

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
      serverPresetFoods={serverPresetFoods}
      serverPermDeletedPromoted={serverPermDeletedPromoted}
      serverEverPromoted={serverEverPromoted}
      serverPermDeletedPresets={serverPermDeletedPresets}
    />
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MACROS = {
  milk:      { cal: 85,    pro: 6,    fat: 3,   label: "Milk" },
  oats:      { cal: 111,   pro: 3.8,  fat: 2.4, label: "Oats" },
  whey:      { cal: 140,   pro: 25,   fat: 1.8, label: "Whey" },
  rice:      { cal: 250,   pro: 4,    fat: 0.5, label: "Rice" },
  paneer50:  { cal: 102,   pro: 12.5, fat: 4.5, label: "Paneer 50g" },
  paneer100: { cal: 203.8, pro: 25,   fat: 9,   label: "Paneer 100g" },
  dal:       { cal: 300,   pro: 15,   fat: 3,   label: "Dal" },
  soya:      { cal: 175,   pro: 25,   fat: 1,   label: "Soya Chunks" },
  wholeEgg:  { cal: 67,    pro: 6,    fat: 5,   label: "Whole Egg" },
  eggWhite:  { cal: 17,    pro: 3.6,  fat: 0,   label: "Egg White" },
};

const FOODS = [
  { id: "milk1",     key: "milk",      section: "Milk" },
  { id: "milk2",     key: "milk",      section: "Milk" },
  { id: "milk3",     key: "milk",      section: "Milk" },
  { id: "oats",      key: "oats",      section: "Grains & Protein" },
  { id: "whey",      key: "whey",      section: "Grains & Protein" },
  { id: "rice",      key: "rice",      section: "Grains & Protein" },
  { id: "paneer50",  key: "paneer50",  section: "Paneer" },
  { id: "paneer100", key: "paneer100", section: "Paneer" },
  { id: "dal1",      key: "dal",       section: "Dal" },
  { id: "dal2",      key: "dal",       section: "Dal" },
  { id: "soya",      key: "soya",      section: "Soya" },
];

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

const HEALTH_TIPS = [
  "💧 Drink at least 8 glasses of water today",
  "🚶 A 20-min walk after meals improves digestion",
  "😴 Quality sleep boosts muscle recovery",
  "🧘 5 mins of deep breathing lowers cortisol",
  "🥦 Eat a rainbow — variety = micronutrients",
  "⏰ Try eating dinner before 8pm for better sleep",
];

function customFoodToPreset(customFood) {
  const id = String(customFood._id || customFood.id);
  return { id: `promoted_${id}`, _promoted: true, _customId: id, label: customFood.name, cal: Number(customFood.cal) || 0, pro: Number(customFood.pro) || 0, fat: Number(customFood.fat) || 0, section: "My Foods" };
}

function calcMacros(items, wholeEggs, eggWhites, customFoods = [], presetFoodList = FOODS) {
  let cal = 0, pro = 0, fat = 0;
  presetFoodList.forEach((f) => {
    const count = Number(items[f.id]) || 0;
    if (f._promoted) { cal += f.cal * count; pro += f.pro * count; fat += f.fat * count; }
    else { cal += MACROS[f.key].cal * count; pro += MACROS[f.key].pro * count; fat += MACROS[f.key].fat * count; }
  });
  cal += wholeEggs * MACROS.wholeEgg.cal + eggWhites * MACROS.eggWhite.cal;
  pro += wholeEggs * MACROS.wholeEgg.pro + eggWhites * MACROS.eggWhite.pro;
  fat += wholeEggs * MACROS.wholeEgg.fat;
  customFoods.forEach((f) => { if (f.checked) { cal += Number(f.cal)||0; pro += Number(f.pro)||0; fat += Number(f.fat)||0; } });
  return { cal: Math.round(cal), pro: Math.round(pro * 10) / 10, fat: Math.round(fat * 10) / 10 };
}

function dateStrOffset(offsetDays) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => dateStrOffset(-(i + 1))).reverse();
}

// ─── Sub-components (kept in same file for simplicity) ────────────────────────
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

function MacroPill({ val, unit, label, rem, color }) {
  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, marginBottom: 2 }}>{val}{unit}</div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text3)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{rem}</div>
    </div>
  );
}

function Stepper({ val, onChange, max = 20 }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 99, overflow: "hidden" }}>
      <button onClick={() => onChange(Math.max(0, val - 1))} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: "8px 14px", fontSize: 18, fontFamily: "inherit" }}>−</button>
      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", padding: "0 8px", minWidth: 28, textAlign: "center", display: "flex", alignItems: "center" }}>{val}</span>
      <button onClick={() => onChange(Math.min(max, val + 1))} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: "8px 14px", fontSize: 18, fontFamily: "inherit" }}>+</button>
    </div>
  );
}

function MiniStepper({ val, onChange }) {
  const b = { border: "1px solid var(--border2)", cursor: "pointer", fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", height: 26, minWidth: 28, padding: "0 8px" };
  return (
    <div style={{ display: "flex", marginTop: 6 }}>
      <button onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, val - 1)); }} style={{ ...b, background: "var(--bg3)", borderRadius: "6px 0 0 6px", color: "var(--text2)" }}>−</button>
      <span style={{ ...b, fontSize: 13, fontWeight: 700, color: val > 0 ? "var(--accent)" : "var(--text3)", padding: "0 10px", borderLeft: "none", borderRight: "none", borderRadius: 0, minWidth: 32, background: val > 0 ? "var(--accentBg)" : "var(--surface2)", cursor: "default" }}>{val}</span>
      <button onClick={(e) => { e.stopPropagation(); onChange(Math.min(20, val + 1)); }} style={{ ...b, background: val > 0 ? "var(--accent)" : "var(--bg3)", border: `1px solid ${val > 0 ? "var(--accent)" : "var(--border2)"}`, borderRadius: "0 6px 6px 0", color: val > 0 ? "#fff" : "var(--text2)" }}>+</button>
    </div>
  );
}

function Card({ title, icon, children, defaultOpen = true }) {
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

function FoodChip({ food, count, onCountChange, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const FOOD_LABEL_MAP = { milk1: "Milk 1", milk2: "Milk 2", milk3: "Milk 3", dal1: "Dal (bowl 1)", dal2: "Dal (bowl 2)" };
  const label = food._promoted ? food.label : (FOOD_LABEL_MAP[food.id] || MACROS[food.key]?.label || food.id);
  const m = food._promoted ? food : MACROS[food.key];
  const subLine = count > 1 ? `${m.cal * count}kcal · ${(m.pro * count).toFixed(1)}g P` : `${m.cal}kcal · ${m.pro}g P · ${m.fat}g F`;
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
    <div style={{ display: "flex", flexDirection: "column", background: checked ? "var(--accentBg)" : "var(--surface2)", border: `1px solid ${checked ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", transition: "all .2s", position: "relative", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div onClick={() => onCountChange(checked ? 0 : 1)} style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${checked ? "var(--accent)" : "var(--border2)"}`, background: checked ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {checked && <svg viewBox="0 0 10 8" width="10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 4,7 9,1" /></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: checked ? "var(--accent)" : "var(--text)", wordBreak: "break-word", lineHeight: 1.3 }}>
            {label}{food._promoted && <span style={{ marginLeft: 5, fontSize: 9, background: "var(--greenBg)", color: "var(--green)", borderRadius: 4, padding: "1px 5px", fontWeight: 700, verticalAlign: "middle" }}>MY FOOD</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.3 }}>{subLine}</div>
        </div>
      </div>
      <MiniStepper val={count} onChange={onCountChange} />
      <button onClick={() => food._promoted ? setConfirmDelete(true) : onDelete("today")} style={{ position: "absolute", top: 4, right: 4, background: "var(--bg3)", border: "none", borderRadius: 99, width: 18, height: 18, cursor: "pointer", fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>✕</button>
    </div>
  );
}

function AddFoodModal({ onAdd, onClose }) {
  const DRAFT_KEY = "vt_food_draft";
  const draft = (() => { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; } })();
  const [name, setName] = useState(draft.name || "");
  const [cal, setCal]   = useState(draft.cal  || "");
  const [pro, setPro]   = useState(draft.pro  || "");
  const [fat, setFat]   = useState(draft.fat  || "");
  const [error, setError] = useState("");

  function saveDraft(patch) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, cal, pro, fat, ...patch }));
  }

  const inp = { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };

  function submit() {
    if (!name.trim()) { setError("Please enter a food name"); return; }
    if (!cal || isNaN(cal) || Number(cal) < 0) { setError("Enter valid calories"); return; }
    setError("");
    sessionStorage.removeItem(DRAFT_KEY);
    onAdd({ name: name.trim(), cal: Number(cal), pro: Number(pro)||0, fat: Number(fat)||0 });
    onClose();
  }
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
            {[
              { key:"cal", label:"Calories *",  color:"var(--accent)", val:cal, set:setCal, ph:"kcal" },
              { key:"pro", label:"Protein (g)",  color:"var(--green)",  val:pro, set:setPro, ph:"g" },
              { key:"fat", label:"Fat (g)",       color:"var(--amber)",  val:fat, set:setFat, ph:"g" },
            ].map((f) => (
              <div key={f.key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: f.color, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{f.label}</div>
                <input value={f.val} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }} placeholder={f.ph} type="number" min="0" step="0.1" style={inp} />
              </div>
            ))}
          </div>
          {error && <div style={{ fontSize: 13, color: "var(--accent)", background: "var(--accentBg)", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--text2)", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={submit} style={{ flex: 2, background: "var(--accent)", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>Add Food</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomFoodChip({ food, onToggle, onDelete, onPromote, isPromoted }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: food.checked ? "var(--accentBg)" : "var(--surface2)", border: `1px solid ${food.checked ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, padding: "10px 8px 10px 10px", position: "relative", minWidth: 0 }}>
      <button onClick={onDelete} style={{ position: "absolute", top: 4, right: 4, background: "var(--bg3)", border: "none", borderRadius: 99, width: 18, height: 18, cursor: "pointer", fontSize: 9, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>✕</button>
      <div onClick={onToggle} style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: `1.5px solid ${food.checked ? "var(--accent)" : "var(--border2)"}`, background: food.checked ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {food.checked && <svg viewBox="0 0 10 8" width="10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 4,7 9,1" /></svg>}
      </div>
      <div onClick={onToggle} style={{ flex: 1, cursor: "pointer", minWidth: 0, paddingRight: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: food.checked ? "var(--accent)" : "var(--text)", wordBreak: "break-word" }}>{food.name}</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{food.cal}kcal · {food.pro}g P · {food.fat}g F</div>
      </div>
      <button onClick={onPromote} title={isPromoted ? "Already in preset list" : "Add to preset Food list"}
        style={{ background: isPromoted ? "var(--greenBg)" : "var(--surface)", border: `1px solid ${isPromoted ? "var(--green)" : "var(--border2)"}`, borderRadius: 6, width: 28, height: 28, marginTop: 14, alignSelf: "flex-end", cursor: isPromoted ? "default" : "pointer", fontSize: 14, color: isPromoted ? "var(--green)" : "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        📌
      </button>
    </div>
  );
}

function DatePickerBar({ selectedDate, onDateChange, isMobile }) {
  const today = todayStr();
  const days = Array.from({ length: 8 }, (_, i) => dateStrOffset(-(7-i)));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  if (isMobile) {
    return (
      <div style={{ marginBottom: 16, position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>{selectedDate === today ? "Today's Log" : `Logging for ${selectedDate}`}</div>
        <button onClick={() => setDropdownOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", border: "1.5px solid var(--accent)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
          <span>📅 {selectedDate === today ? "Today" : selectedDate}</span>
          <span style={{ fontSize: 12, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform .2s", display: "inline-block" }}>▾</span>
        </button>
        {dropdownOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.15)", zIndex: 200, overflow: "hidden" }}>
            {[...days].reverse().map((d) => {
              const isT = d===today, isSel = d===selectedDate;
              return <button key={d} onClick={() => { onDateChange(d); setDropdownOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: isSel ? "var(--accentBg)" : "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit", color: isSel||isT ? "var(--accent)" : "var(--text)", fontWeight: isSel||isT ? 700 : 400, fontSize: 14, textAlign: "left" }}>
                <span>{isT ? "📅 Today" : d}</span>{isSel && <span style={{ fontSize: 12 }}>✓</span>}
              </button>;
            })}
          </div>
        )}
        {dropdownOpen && <div onClick={() => setDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />}
        {selectedDate !== today && <button onClick={() => onDateChange(today)} style={{ marginTop: 8, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, width: "100%" }}>← Back to Today</button>}
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
        {selectedDate === today ? "Today's Log" : `Logging for ${selectedDate}`}
        {selectedDate !== today && <button onClick={() => onDateChange(today)} style={{ marginLeft: 10, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>← Back to Today</button>}
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
        {days.map((d) => {
          const isT = d===today, isSel = d===selectedDate;
          return <button key={d} onClick={() => onDateChange(d)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${isSel ? "var(--accent)" : "var(--border)"}`, background: isSel ? "var(--accent)" : isT ? "var(--accentBg)" : "var(--surface2)", color: isSel ? "#fff" : isT ? "var(--accent)" : "var(--text3)", fontSize: 11, fontWeight: isSel||isT ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
            {isT ? "Today" : d.slice(5).replace("-","/")}
          </button>;
        })}
      </div>
    </div>
  );
}

// ─── WeeklySummaryCard ────────────────────────────────────────────────────────
function WeeklySummaryCard({ targets }) {
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeek() {
      setLoading(true);
      const days = getLast7Days();
      try {
        const results = await Promise.all(days.map((d) => api.getLog(d).catch(() => null)));
        const valid = results.filter(Boolean);
        if (!valid.length) { setWeekData(null); setLoading(false); return; }

        function calcLogCal(log) {
          let cal = 0;
          const it = log.items || {};
          FOODS.forEach((f) => { if (it[f.id]) cal += MACROS[f.key].cal * (Number(it[f.id]) || 1); });
          cal += (log.wholeEggs || 0) * MACROS.wholeEgg.cal + (log.eggWhites || 0) * MACROS.eggWhite.cal;
          return cal;
        }
        function calcLogPro(log) {
          let pro = 0;
          const it = log.items || {};
          FOODS.forEach((f) => { if (it[f.id]) pro += MACROS[f.key].pro * (Number(it[f.id]) || 1); });
          pro += (log.wholeEggs || 0) * MACROS.wholeEgg.pro + (log.eggWhites || 0) * MACROS.eggWhite.pro;
          return pro;
        }

        const avgCal = Math.round(valid.reduce((s, l) => s + (l.calories || calcLogCal(l)), 0) / valid.length);
        const avgPro = Math.round((valid.reduce((s, l) => s + (l.protein || calcLogPro(l)), 0) / valid.length) * 10) / 10;
        const stepsLogs = valid.filter((l) => l.steps);
        const avgSteps = stepsLogs.length ? Math.round(stepsLogs.reduce((s, l) => s + Number(l.steps || 0), 0) / stepsLogs.length) : 0;
        const avgWater = Math.round((valid.reduce((s, l) => s + (l.water || 0), 0) / valid.length) * 10) / 10;

        const weight = await api.getWeight();
        const today = todayStr();
        const weekStart = days[0];
        const weekWeights = weight.filter((w) => w.date >= weekStart && w.date <= today);
        let weightChange = null;
        if (weekWeights.length >= 2) {
          weightChange = (weekWeights[weekWeights.length - 1].value - weekWeights[0].value).toFixed(1);
        }

        setWeekData({ avgCal, avgPro, avgSteps, avgWater, weightChange, daysLogged: valid.length });
      } catch { setWeekData(null); }
      setLoading(false);
    }
    fetchWeek();
  }, []);

  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7;
  const isSunday = today.getDay() === 0;

  return (
    <Card title="Weekly Summary" icon="📊" defaultOpen={true}>
      {!isSunday && (
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10, background: "var(--surface2)", padding: "8px 12px", borderRadius: 8 }}>
          📅 Full summary updates every Sunday ·{" "}
          {daysUntilSunday === 0 ? "Today!" : `${daysUntilSunday} day${daysUntilSunday > 1 ? "s" : ""} to go`}{" "}
          · Showing last 7 days
        </div>
      )}
      {loading ? (
        <div style={{ fontSize: 13, color: "var(--text3)", padding: "12px 0" }}>Loading week data…</div>
      ) : !weekData ? (
        <div style={{ fontSize: 13, color: "var(--text3)", padding: "12px 0", textAlign: "center" }}>
          No data yet — start logging to see your weekly summary!
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>
            Based on {weekData.daysLogged} day{weekData.daysLogged !== 1 ? "s" : ""} logged this week
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "Avg Calories", value: weekData.avgCal, unit: " kcal", target: targets?.cal, color: "var(--accent)" },
              { label: "Avg Protein",  value: weekData.avgPro, unit: "g",     target: targets?.pro, color: "var(--green)" },
              { label: "Avg Steps",    value: weekData.avgSteps ? weekData.avgSteps.toLocaleString() : "—", unit: "", target: null, color: "var(--blue,#2563EB)" },
              { label: "Avg Water",    value: weekData.avgWater, unit: " gl", target: null, color: "var(--blue,#2563EB)" },
            ].map((item) => {
              const numVal = typeof item.value === "number" ? item.value : null;
              const pct = item.target && numVal ? Math.round((numVal / item.target) * 100) : null;
              return (
                <div key={item.label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 10px" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text3)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}{item.unit}</div>
                  {pct !== null && (
                    <div style={{ fontSize: 11, color: pct >= 100 ? "var(--green)" : "var(--text3)", marginTop: 3 }}>
                      {pct >= 100 ? "✓ Target hit on avg" : `${pct}% of target`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {weekData.weightChange !== null && (
            <div style={{ background: parseFloat(weekData.weightChange) <= 0 ? "var(--greenBg)" : "var(--accentBg)", border: `1px solid ${parseFloat(weekData.weightChange) <= 0 ? "var(--green)" : "var(--accent)"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: parseFloat(weekData.weightChange) <= 0 ? "var(--green)" : "var(--accent)", fontWeight: 600 }}>
              ⚖️ Weight change this week: {parseFloat(weekData.weightChange) > 0 ? "+" : ""}{weekData.weightChange} kg
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── WeightPanel ──────────────────────────────────────────────────────────────
function WeightPanel({ wtInput, setWtInput, logWeight, wtHistory, setWtHistory, dark, pred, desktop }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const displayHistory = [...wtHistory].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  function getEntryId(e) { return e._id || e.id; }
  function startEdit(e) { setEditingId(getEntryId(e)); setEditValue(String(e.value)); }
  async function saveEdit(e) {
    const v = parseFloat(editValue); const id = getEntryId(e); if (!v||v<=0||!id) { setEditingId(null); return; }
    setEditingId(null); setWtHistory((prev) => prev.map((x) => getEntryId(x)===id ? { ...x, value: v } : x));
    try { await api.updateWeight(id, v); } catch (err) { console.error(err); setWtHistory((prev) => prev.map((x) => getEntryId(x)===id ? { ...x, value: e.value } : x)); }
  }
  async function deleteEntry(e) {
    const id = getEntryId(e); if (!id) return;
    setWtHistory((prev) => prev.filter((x) => getEntryId(x) !== id));
    try { await api.deleteWeight(id); } catch (err) { console.error(err); setWtHistory((prev) => { const n = [...prev, e]; n.sort((a,b) => a.date.localeCompare(b.date)); return n; }); }
    if (editingId === id) setEditingId(null);
  }

  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!wtHistory.length || !window.Chart) return;
    const gridColor = dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)";
    const textColor = dark ? "#6B6358" : "#9A9386";
    chartRef.current = new window.Chart(canvasRef.current.getContext("2d"), {
      type: "line",
      data: {
        labels: wtHistory.map((h) => h.displayDate || h.date),
        datasets: [{ data: wtHistory.map((h) => h.value), borderColor: "#D4582A", backgroundColor: "rgba(212,88,42,.08)", borderWidth: 2, pointBackgroundColor: "#D4582A", pointBorderColor: dark ? "#1F1D19" : "#fff", pointBorderWidth: 2, pointRadius: 5, tension: 0.4, fill: true }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => parseFloat(c.parsed.y).toFixed(2).replace(/\.?0+$/, "") + "kg" } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 11 }, callback: (v) => parseFloat(v).toFixed(2).replace(/\.?0+$/, "") + "kg" } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [wtHistory, dark]);

  return (
    <div style={{ display: desktop ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      <Card title="Log Weight" icon="⚖️">
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={wtInput} onChange={(e) => setWtInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && logWeight()} placeholder="Weight in kg" type="number" step="0.1" style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 15, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
          <button onClick={logWeight} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Log</button>
        </div>
        {wtHistory.length === 0
          ? <div style={{ textAlign: "center", color: "var(--text3)", padding: "20px 0", fontSize: 13 }}>No weight entries yet</div>
          : <canvas ref={canvasRef} height={160} style={{ width: "100%" }} />
        }
        {pred && <div style={{ background: "var(--greenBg)", border: "1px solid var(--green)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--green)", fontWeight: 600, marginTop: 10, display: "flex", alignItems: "center", gap: 7 }}>🎯 {pred}</div>}
      </Card>

      <Card title="Weight History" icon="📅">
        {wtHistory.length === 0 ? <div style={{ textAlign: "center", color: "var(--text3)", padding: "20px 0", fontSize: 13 }}>No entries yet</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {displayHistory.map((h) => {
              const hId = String(getEntryId(h)); const isEditing = editingId === hId;
              return (
                <div key={hId||h.date} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: isEditing ? "var(--accentBg)" : "var(--surface2)", borderRadius: 10, border: isEditing ? "1px solid var(--accent)" : "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--text3)", flex: 1 }}>{h.displayDate || h.date}</span>
                  {isEditing
                    ? <input autoFocus type="number" step="0.1" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key==="Enter") saveEdit(h); if (e.key==="Escape") setEditingId(null); }} style={{ width: 72, background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 7, padding: "4px 8px", fontSize: 14, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Sans',sans-serif", outline: "none", textAlign: "right" }} />
                    : <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", minWidth: 56, textAlign: "right" }}>{h.value} kg</span>
                  }
                  {isEditing ? <>
                    <button onClick={() => saveEdit(h)} style={{ background: "var(--green)", border: "none", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg viewBox="0 0 10 8" width="11" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 4,7 9,1" /></svg></button>
                    <button onClick={() => setEditingId(null)} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: "var(--text3)" }}>✕</button>
                  </> : <>
                    <button onClick={() => startEdit(h)} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>✏️</button>
                    <button onClick={() => deleteEntry(h)} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>🗑</button>
                  </>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── MiniLineChart ────────────────────────────────────────────────────────────
function MiniLineChart({ history, dark, color, unit, yCallback }) {
  const cRef = useRef(null); const chRef = useRef(null);
  useEffect(() => {
    if (!cRef.current) return;
    if (chRef.current) { chRef.current.destroy(); chRef.current = null; }
    if (!history.length || !window.Chart) return;
    const gridColor = dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)";
    const textColor = dark ? "#6B6358" : "#9A9386";
    chRef.current = new window.Chart(cRef.current.getContext("2d"), {
      type: "line",
      data: { labels: history.map((h) => h.date), datasets: [{ data: history.map((h) => h.value), borderColor: color, backgroundColor: color + "14", borderWidth: 2, pointBackgroundColor: color, pointBorderColor: dark ? "#1F1D19" : "#fff", pointBorderWidth: 2, pointRadius: 4, tension: 0.4, fill: true }] },
      options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y + unit } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 10 }, maxTicksLimit: 7 } }, y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: "DM Sans", size: 10 }, callback: yCallback || ((v) => v + unit) } } } },
    });
    return () => { if (chRef.current) { chRef.current.destroy(); chRef.current = null; } };
  }, [history, dark, color, unit]);
  if (!history.length) return null;
  return <canvas ref={cRef} height={130} style={{ width: "100%" }} />;
}

// ─── HealthPanel ──────────────────────────────────────────────────────────────
function HealthPanel({ water, handleWater, steps, handleSteps, wtHistory, userProfile, targets, dark, desktop, tipIdx, isToday }) {
  const [localSteps, setLocalSteps] = useState(steps);
  const [stepsHistory, setStepsHistory] = useState(() => store.get("vt_steps_history", []));
  const [waterHistory, setWaterHistory] = useState(() => store.get("vt_water_history", []));

  useEffect(() => { setLocalSteps(steps); }, [steps]);

  useEffect(() => {
    if (!steps || !isToday) return;
    const today = todayStr();
    setStepsHistory((prev) => {
      const filtered = prev.filter((e) => e.date !== today);
      const next = [...filtered, { date: today, value: Number(steps) }].sort((a,b) => a.date.localeCompare(b.date)).slice(-30);
      store.set("vt_steps_history", next);
      return next;
    });
  }, [steps, isToday]);

  useEffect(() => {
    if (!isToday) return;
    const today = todayStr();
    setWaterHistory((prev) => {
      const filtered = prev.filter((e) => e.date !== today);
      const next = [...filtered, { date: today, value: water }].sort((a,b) => a.date.localeCompare(b.date)).slice(-30);
      store.set("vt_water_history", next);
      return next;
    });
  }, [water, isToday]);

  const heightCm = parseFloat(userProfile?.height);
  const latestWeight = wtHistory.length > 0 ? wtHistory[wtHistory.length - 1].value : null;
  const bmi = heightCm > 0 && latestWeight ? (latestWeight / (heightCm / 100) ** 2).toFixed(1) : null;
  const waterLitres = (water * 0.25).toFixed(2);

  return (
    <div style={{ display: desktop ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      <div>
        <Card title="Today's Tip" icon="✨">
          <div style={{ background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 12, padding: 16, fontSize: 14, color: "var(--accent)", fontWeight: 600, lineHeight: 1.6 }}>{HEALTH_TIPS[tipIdx]}</div>
        </Card>

        <Card title="Hydration Tracker" icon="💧">
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "var(--blue,#2563EB)" }}>{water}</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>glasses today · <span style={{ color: "var(--blue,#2563EB)", fontWeight: 600 }}>{waterLitres} L</span> · goal: 15 gl (3.75 L)</div>
            <ProgBar val={water} max={15} color="#2563EB" />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: waterHistory.length > 1 ? 16 : 0 }}>
            <button onClick={() => handleWater(Math.max(0, water-1))} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 18, color: "var(--text)" }}>−</button>
            <button onClick={() => handleWater(Math.min(25, water+1))} style={{ background: "#2563EB", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 18, color: "#fff" }}>+ Glass</button>
          </div>
          {waterHistory.length > 1 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Water History</div>
            <MiniLineChart history={waterHistory.slice(-14)} dark={dark} color="#2563EB" unit=" gl" />
          </>}
        </Card>

        <WeeklySummaryCard targets={targets} />
      </div>

      <div>
        {bmi !== null && (
          <Card title="BMI Estimate" icon="📊">
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: parseFloat(bmi) < 18.5 ? "var(--blue,#2563EB)" : parseFloat(bmi) < 25 ? "var(--green)" : "var(--amber)" }}>{bmi}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
                {parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal weight ✓" : parseFloat(bmi) < 30 ? "Overweight" : "Obese"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Based on latest weight · {heightCm}cm height</div>
            </div>
          </Card>
        )}

        <Card title="Steps Tracker" icon="🚶">
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input type="number" value={localSteps} placeholder="Enter steps today" onChange={(e) => { setLocalSteps(e.target.value); handleSteps(e.target.value); }} style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
          </div>
          {localSteps > 0 && <div style={{ marginBottom: stepsHistory.length > 1 ? 12 : 0 }}>
            <ProgBar val={parseInt(localSteps)} max={10000} color="var(--green)" />
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>{parseInt(localSteps) >= 10000 ? "🎉 Goal of 10,000 steps reached!" : `${(10000 - parseInt(localSteps)).toLocaleString()} more steps to goal`}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>≈ {Math.round(parseInt(localSteps) * 0.04)} kcal burned</div>
          </div>}
          {stepsHistory.length > 1 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6, marginTop: localSteps > 0 ? 0 : 4 }}>Step History</div>
            <MiniLineChart history={stepsHistory.slice(-14)} dark={dark} color="#2D7A5C" unit=" steps" yCallback={(v) => v >= 1000 ? (v/1000).toFixed(1)+"k" : v} />
          </>}
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

// ─── MainApp ──────────────────────────────────────────────────────────────────
function MainApp({ user, onLogout, dark, setDark, userTargets, userGoal, userProfile, onResetGoal, serverPresetFoods, serverPermDeletedPromoted, serverEverPromoted, serverPermDeletedPresets }) {
  const TARGETS = userTargets || DEFAULT_TARGETS;
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [items, setItems] = useState({});
  const [wholeEggs, setWholeEggs] = useState(0);
  const [eggWhites, setEggWhites] = useState(0);
  const [customFoods, setCustomFoods] = useState([]);
  const [presetFoods, setPresetFoods] = useState(() => {
    const pDelPromoted = serverPermDeletedPromoted || store.get("vt_perm_deleted_promoted", []);
    const pDelPresets  = serverPermDeletedPresets  || store.get("vt_perm_deleted_presets",  []);
    const savedFoods   = serverPresetFoods?.length > 0 ? serverPresetFoods : (store.get("vt_preset_foods", null) || FOODS);

    const base = savedFoods.filter((f) => {
      if (f._promoted) return !pDelPromoted.includes(f._customId);
      return !pDelPresets.includes(f.id);
    });

    return base;
  });
  const [permDeletedPromoted, setPermDeletedPromoted] = useState(() => serverPermDeletedPromoted || store.get("vt_perm_deleted_promoted", []));
  const [everPromoted, setEverPromoted] = useState(() => serverEverPromoted || store.get("vt_ever_promoted", []));
  const [permDeletedPresets, setPermDeletedPresets] = useState(() => serverPermDeletedPresets || store.get("vt_perm_deleted_presets", []));
  const [wtInput, setWtInput] = useState("");
  const [wtHistory, setWtHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("tracker");
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tipIdx] = useState(() => Math.floor(Math.random() * HEALTH_TIPS.length));
  const [quoteIdx] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const [desktop, setDesktop] = useState(() => window.innerWidth >= 768);
  const syncTimer = useRef(null);
  const presetSyncTimer = useRef(null);
  const presetInitialized = useRef(false);
  const midnightResetInProgress = useRef(false);
  const modalOpenRef = useRef(false);
  const isToday = selectedDate === todayStr();

  // ─── FIX 1: Ref that always holds the latest customFoods without stale closure ───
  const customFoodsRef = useRef(customFoods);
  useEffect(() => { customFoodsRef.current = customFoods; }, [customFoods]);

  // ─── FIX 2: Ref that always holds latest everPromoted / permDeletedPromoted ───
  const everPromotedRef = useRef(everPromoted);
  useEffect(() => { everPromotedRef.current = everPromoted; }, [everPromoted]);
  const permDeletedPromotedRef = useRef(permDeletedPromoted);
  useEffect(() => { permDeletedPromotedRef.current = permDeletedPromoted; }, [permDeletedPromoted]);

  const macros = calcMacros(items, wholeEggs, eggWhites, customFoods, presetFoods);
  const rCal = TARGETS.cal - macros.cal, rPro = TARGETS.pro - macros.pro, rFat = TARGETS.fat - macros.fat;

  useEffect(() => { modalOpenRef.current = showAddModal; }, [showAddModal]);
  useEffect(() => { const fn = () => setDesktop(window.innerWidth >= 768); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  useEffect(() => {
    if (!presetInitialized.current) { presetInitialized.current = true; return; }
    store.set("vt_preset_foods", presetFoods); store.set("vt_perm_deleted_promoted", permDeletedPromoted); store.set("vt_ever_promoted", everPromoted); store.set("vt_perm_deleted_presets", permDeletedPresets);
    if (presetSyncTimer.current) clearTimeout(presetSyncTimer.current);
    presetSyncTimer.current = setTimeout(() => {
      api.saveProfile({ goal: userGoal, profile: userProfile, targets: TARGETS, presetFoods, permDeletedPromoted, everPromoted, permDeletedPresets }).catch(console.error);
    }, 1000);
  }, [presetFoods, permDeletedPromoted, everPromoted, permDeletedPresets]);

  // ─── FIX 1 (midnight reset): Use ref to read customFoods synchronously, await all toggles ───
  useEffect(() => {
    async function checkMidnightReset() {
      const lastDate = localStorage.getItem("vt_log_date");
      const today = todayStr();
      if (lastDate && lastDate !== today) {
        midnightResetInProgress.current = true;
        setItems({});
        setWholeEggs(0);
        setEggWhites(0);
        setWater(0);
        setSteps("");

        // Use the ref to get fresh customFoods synchronously — avoids stale closure
        const toUntoggle = customFoodsRef.current.filter((f) => f.checked);
        // Optimistically clear checked state in UI immediately
        setCustomFoods((prev) => prev.map((f) => ({ ...f, checked: false })));
        // Persist all toggles to server, then clear the reset lock
        try {
          await Promise.all(
            toUntoggle.map((f) => api.toggleCustomFood(f._id || f.id, false).catch(console.error))
          );
        } finally {
          midnightResetInProgress.current = false;
        }
      }
      localStorage.setItem("vt_log_date", today);
    }
    checkMidnightReset();
    const interval = setInterval(checkMidnightReset, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoadingData(true);
      try {
        const [log, weight, foods] = await Promise.all([api.getLog(selectedDate), api.getWeight(), api.getCustomFoods()]);
        setItems(log.items || {}); setWholeEggs(log.wholeEggs || 0); setEggWhites(log.eggWhites || 0); setWater(log.water || 0); setSteps(log.steps || "");
        setWtHistory(weight);
        const normalizedFoods = foods.map((f) => ({ ...f, id: String(f._id||f.id), _id: String(f._id||f.id) }));
        setCustomFoods(normalizedFoods);

        // Restore any everPromoted foods that were "deleted for today" and are missing from presetFoods
        setPresetFoods((prev) => {
          const currentPromotedIds = new Set(prev.filter((f) => f._promoted).map((f) => f._customId));
          const missingPromoted = normalizedFoods.filter((cf) => {
            const cid = String(cf._id || cf.id);
            return everPromotedRef.current.includes(cid) && !permDeletedPromotedRef.current.includes(cid) && !currentPromotedIds.has(cid);
          }).map(customFoodToPreset);
          if (missingPromoted.length === 0) return prev;
          return [...prev, ...missingPromoted];
        });
      } catch (err) { console.error("Load error:", err); } finally { setLoadingData(false); }
    }
    loadAll();
  }, [selectedDate]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (modalOpenRef.current || !isToday || midnightResetInProgress.current) return;
      try {
        const [log, foods] = await Promise.all([api.getLog(selectedDate), api.getCustomFoods()]);
        setItems(log.items || {}); setWholeEggs(log.wholeEggs || 0); setEggWhites(log.eggWhites || 0); setWater(log.water || 0); setSteps(log.steps || "");
        setCustomFoods(foods.map((f) => ({ ...f, id: String(f._id||f.id), _id: String(f._id||f.id) })));
      } catch (err) { console.error("Poll error:", err); }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedDate, isToday]);

  function scheduleSave(patch) {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    setSyncing(true);
    syncTimer.current = setTimeout(async () => {
      try { await api.saveLog({ ...patch, date: selectedDate }); } catch (e) { console.error("Save error:", e); }
      setSyncing(false);
    }, 800);
  }

  function setItemCount(id, count) {
    setItems((prev) => { const next = { ...prev, [id]: count }; if (count === 0) delete next[id]; scheduleSave({ items: next }); return next; });
  }
  function handleWholeEggs(v) { setWholeEggs(v); scheduleSave({ wholeEggs: v }); }
  function handleEggWhites(v) { setEggWhites(v); scheduleSave({ eggWhites: v }); }
  function handleWater(v) { setWater(v); scheduleSave({ water: v }); }
  function handleSteps(v) { setSteps(v); scheduleSave({ steps: v }); }

  async function addCustomFood(food) {
    try { const saved = await api.addCustomFood(food); const n = { ...saved, id: String(saved._id||saved.id), _id: String(saved._id||saved.id) }; setCustomFoods((prev) => [n, ...prev]); } catch (err) { console.error(err); }
  }
  async function toggleCustomFood(id) {
    setCustomFoods((prev) => { const next = prev.map((f) => String(f.id)===String(id) ? { ...f, checked: !f.checked } : f); const food = next.find((f) => String(f.id)===String(id)); if (food) api.toggleCustomFood(id, food.checked).catch(console.error); return next; });
  }
  async function deleteCustomFood(id) {
    setCustomFoods((prev) => prev.filter((f) => String(f.id)!==String(id)));
    api.deleteCustomFood(id).catch(console.error);
    setPresetFoods((prev) => prev.filter((f) => !(f._promoted && f._customId===String(id))));
  }
  function promoteCustomFood(customFood) {
    const customId = String(customFood._id||customFood.id);
    if (presetFoods.some((f) => f._promoted && f._customId===customId)) return;
    setEverPromoted((prev) => prev.includes(customId) ? prev : [...prev, customId]);
    setPresetFoods((prev) => [...prev, customFoodToPreset(customFood)]);
  }
  function deletePresetFood(id, mode) {
    const food = presetFoods.find((f) => f.id === id);
    if (food?._promoted) {
      if (mode === "permanent") {
        setPermDeletedPromoted((prev) => prev.includes(food._customId) ? prev : [...prev, food._customId]);
      }
      // "today" mode: just remove from presetFoods — restore via resetPresetFoods uses everPromoted
    } else {
      if (food) setPermDeletedPresets((prev) => prev.includes(id) ? prev : [...prev, id]);
    }
    setPresetFoods((prev) => prev.filter((f) => f.id !== id));
    setItems((prev) => { const next = { ...prev }; delete next[id]; scheduleSave({ items: next }); return next; });
  }

  // ─── FIX 2: Use customFoodsRef to avoid stale closure in resetPresetFoods ───
  function resetPresetFoods() {
    // Restore all built-in presets except those permanently deleted
    const restoredBuiltins = FOODS.filter((f) => !permDeletedPresets.includes(f.id));

    // Use the ref so we always get the current customFoods list, not a stale snapshot
    const promotedEntries = customFoodsRef.current
      .filter((cf) => {
        const cid = String(cf._id || cf.id);
        return everPromotedRef.current.includes(cid) && !permDeletedPromotedRef.current.includes(cid);
      })
      .map(customFoodToPreset);

    setPresetFoods([...restoredBuiltins, ...promotedEntries]);
    // Only clear permDeletedPresets (built-in "today" deletes), NOT permDeletedPromoted
    setPermDeletedPresets([]);
  }

  async function logWeight() {
    const v = parseFloat(wtInput); if (!v) return;
    try {
      const entry = await api.logWeight(v, selectedDate);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const [yr, mo, dy] = (entry.date || selectedDate).split("-");
      const entryWithDisplay = { ...entry, date: entry.date||selectedDate, displayDate: `${parseInt(dy)} ${months[parseInt(mo)-1]} ${yr.slice(2)}` };
      setWtHistory((prev) => { const f = prev.filter((e) => e.date !== entryWithDisplay.date); const n = [...f, entryWithDisplay]; n.sort((a,b) => a.date.localeCompare(b.date)); return n; });
      setWtInput("");
    } catch (err) { console.error(err); }
  }

  function weightPrediction() {
    if (wtHistory.length < 2) return null;
    const first = wtHistory[0].value, last = wtHistory[wtHistory.length-1].value;
    const isLosing = userGoal === "lose";
    const rate = isLosing ? (first-last)/wtHistory.length : (last-first)/wtHistory.length;
    if (rate <= 0) return isLosing ? "No downward trend yet — keep going!" : "No upward trend yet — keep eating!";
    const target = parseFloat(userProfile?.targetWeight); if (!target) return null;
    const days = Math.ceil(Math.abs(last-target)/rate);
    return `Reach ${target}kg in ~${days} day${days===1?"":"s"} at this pace`;
  }

  function getSuggestion() {
    if (rPro > 25 && rFat < 10) return "Add Whey Protein or Egg Whites for protein 💪";
    if (rPro > 20 && rFat > 10) return "Have some Soya or Moong Dal 🫘";
    if (rFat > 20) return "Skip Paneer today, try egg whites 🧀";
    if (macros.cal >= TARGETS.cal && macros.pro >= TARGETS.pro) return "All goals met — amazing job! 🌿";
    return "Keep logging to hit your targets!";
  }

  const promotedCustomIds = new Set(presetFoods.filter((f) => f._promoted).map((f) => f._customId));
  const sections = ["Milk","Grains & Protein","Paneer","Dal","Soya","My Foods"];
  const pred = weightPrediction();

  const navTabs = [{ id: "tracker", icon: "🥗", label: "Tracker" }, { id: "weight", icon: "⚖️", label: "Weight" }, { id: "health", icon: "❤️", label: "Health" }];

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

  function TrackerPanel() {
    return (
      <>
        {showAddModal && <AddFoodModal onAdd={addCustomFood} onClose={() => setShowAddModal(false)} />}
        <DatePickerBar selectedDate={selectedDate} onDateChange={setSelectedDate} isMobile={!desktop} />
        {!isToday && <div style={{ background: "var(--amberBg)", border: "1px solid var(--amber)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "var(--amber)", fontWeight: 600 }}>📅 Editing past log for {selectedDate} — changes will be saved to that date</div>}
        <div style={{ display: desktop ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          <div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: "0 1px 3px rgba(26,24,20,.06),0 4px 16px rgba(26,24,20,.08)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <MacroPill val={macros.cal} unit="" label="kcal" rem={rCal > 0 ? rCal+" left" : "✓ Met!"} color="var(--accent)" />
                <MacroPill val={macros.pro} unit="g" label="protein" rem={rPro > 0 ? rPro.toFixed(0)+"g left" : "✓ Met!"} color="var(--green)" />
                <MacroPill val={macros.fat} unit="g" label="fat" rem={rFat > 0 ? rFat.toFixed(0)+"g left" : "✓ Met!"} color="var(--amber)" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[{ label: "Calories", val: macros.cal, max: TARGETS.cal, color: "var(--accent)" }, { label: "Protein", val: macros.pro, max: TARGETS.pro, color: "var(--green)" }, { label: "Fat", val: macros.fat, max: TARGETS.fat, color: "var(--amber)" }].map((p) => (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, width: 60, flexShrink: 0 }}>{p.label}</span>
                    <ProgBar val={p.val} max={p.max} color={p.color} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 10, padding: "12px 14px", marginBottom: 12, fontSize: 13, color: "var(--accent)", fontWeight: 500, fontStyle: "italic", lineHeight: 1.5, display: "flex", gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>✨</span>
              <span>"{MOTIVATIONAL_QUOTES[quoteIdx]}"</span>
            </div>
            <Card title="Food" icon="🥗">
              {sections.filter((sec) => presetFoods.some((f) => f.section === sec)).map((sec) => (
                <div key={sec}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", margin: "12px 0 8px" }}>{sec}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {presetFoods.filter((f) => f.section === sec).map((f) => (
                      <FoodChip key={f.id} food={f} count={Number(items[f.id])||0} onCountChange={(count) => setItemCount(f.id, count)} onDelete={(mode) => deletePresetFood(f.id, mode)} />
                    ))}
                  </div>
                </div>
              ))}
              {presetFoods.length === 0 && <div style={{ textAlign: "center", padding: "12px 0" }}><div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>All preset foods removed.</div><button onClick={resetPresetFoods} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, color: "var(--text2)", fontFamily: "inherit" }}>↺ Restore presets</button></div>}
              {presetFoods.length > 0 && <button onClick={resetPresetFoods} style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text3)", fontFamily: "inherit", textDecoration: "underline" }}>↺ Restore all preset foods</button>}
            </Card>
            <Card title="My Custom Foods" icon="✏️">
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px" }}>
                📌 Tap the pin icon on any food to add it to the preset Food list above
              </div>
              <button onClick={() => setShowAddModal(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--accentBg)", border: "1.5px dashed var(--accent)", borderRadius: 10, padding: "11px 0", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "inherit", marginBottom: customFoods.length ? 12 : 0 }}>➕ Add Custom Food</button>
              {customFoods.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {customFoods.map((f) => <CustomFoodChip key={f.id} food={f} onToggle={() => toggleCustomFood(f.id)} onDelete={() => deleteCustomFood(f.id)} onPromote={() => promoteCustomFood(f)} isPromoted={promotedCustomIds.has(String(f._id||f.id))} />)}
                </div>
              )}
              {customFoods.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 12, paddingTop: 10 }}>
                  No custom foods yet — add your own meals above!
                </div>
              )}
            </Card>
          </div>
          <div>
            <Card title="Eggs" icon="🥚">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Whole Eggs", val: wholeEggs, set: handleWholeEggs, sub: "67kcal · 6g P · 5g F each" },
                  { label: "Egg Whites", val: eggWhites, set: handleEggWhites, sub: "17kcal · 3.6g P · 0g F each" },
                ].map((e) => (
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

            <Card title="Weight Projection" icon="📈" defaultOpen={true}>
              {(() => {
                if (!userProfile?.weight || !userProfile?.height || !userProfile?.age) return (
                  <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", padding: "12px 0" }}>
                    Complete your goal setup to see projections.
                    <br />
                    <button onClick={onResetGoal} style={{ marginTop: 8, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, color: "var(--accent)", fontFamily: "inherit" }}>⚙ Set Goals</button>
                  </div>
                );
                function calcMifflinLocal({ weight, height, age, gender, activity, goal, steps = "5000" }) {
                  const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
                  const actMultiplier = parseFloat((activity || "1.55").replace("-none", ""));
                  const bmr = gender === "male" ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161;
                  const stepsBonus = { 2000: 0, 5000: 50, 8000: 100, 10000: 150 }[steps] ?? 0;
                  const tdee = Math.round(bmr * actMultiplier * 0.81) + stepsBonus;
                  return { bmr: Math.round(bmr), tdee };
                }
                const { tdee } = calcMifflinLocal({ ...userProfile, goal: userGoal });
                const dailyDiff = TARGETS.cal - tdee;
                const weeklyKg = (dailyDiff * 7) / 7700;
                const curWeight = parseFloat(userProfile.weight);
                const projections = [
                  { label: "1 Week",   weeks: 1 },
                  { label: "2 Weeks",  weeks: 2 },
                  { label: "1 Month",  weeks: 4.33 },
                  { label: "2 Months", weeks: 8.66 },
                  { label: "3 Months", weeks: 13 },
                  { label: "6 Months", weeks: 26 },
                ].map((p) => {
                  const change = weeklyKg * p.weeks;
                  return { label: p.label, change: change.toFixed(1), projected: (curWeight + change).toFixed(1) };
                });
                return (
                  <>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>Based on your {TARGETS.cal} kcal/day target vs your TDEE</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {projections.map((p, i) => {
                        const isLoss = parseFloat(p.change) < 0;
                        const isGood = userGoal === "lose" ? isLoss : !isLoss;
                        return (
                          <div key={i} style={{ background: isGood ? "var(--greenBg)" : "var(--accentBg)", border: `1px solid ${isGood ? "var(--green)" : "var(--accent)"}`, borderRadius: 10, padding: 12 }}>
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

  const panels = {
    tracker: <TrackerPanel />,
    weight: <WeightPanel wtInput={wtInput} setWtInput={setWtInput} logWeight={logWeight} wtHistory={wtHistory} setWtHistory={setWtHistory} dark={dark} pred={pred} desktop={desktop} />,
    health: <HealthPanel water={water} handleWater={handleWater} steps={steps} handleSteps={handleSteps} wtHistory={wtHistory} userProfile={userProfile} targets={TARGETS} dark={dark} desktop={desktop} tipIdx={tipIdx} isToday={isToday} />,
  };

  function Sidebar() {
    return (
      <div style={{ width: 220, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: "28px 24px 20px" }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "var(--text)" }}>Vitals</div>
          <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>Daily Tracker</div>
        </div>
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navTabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", background: activeTab===t.id ? "var(--accentBg)" : "transparent", color: activeTab===t.id ? "var(--accent)" : "var(--text2)", fontWeight: activeTab===t.id ? 700 : 500, fontSize: 14, marginBottom: 2, textAlign: "left" }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>{user.email}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setDark((d) => !d)} style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 0", cursor: "pointer", fontSize: 14, color: "var(--text2)" }}>{dark ? "☀️" : "🌙"}</button>
            <button onClick={onLogout} style={{ flex: 1, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 6px", cursor: "pointer", fontSize: 12, color: "var(--text3)", fontFamily: "inherit" }}>Logout</button>
          </div>
          <button onClick={onResetGoal} style={{ width: "100%", marginTop: 8, background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 12, color: "var(--accent)", fontFamily: "inherit", fontWeight: 600 }}>⚙ Edit Goals & Targets</button>
        </div>
      </div>
    );
  }

  function BottomNav() {
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", padding: "8px 0 12px", zIndex: 100 }}>
        {navTabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: activeTab===t.id ? "var(--accent)" : "var(--text3)" }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>{t.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {desktop && <Sidebar />}
      <div style={{ flex: 1, overflowY: "auto", padding: desktop ? "28px 32px" : "20px 16px 80px", minWidth: 0 }}>
        {!desktop && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: "var(--text)" }}>Vitals</div>
              <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Hi, {user.name}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {syncing && <span style={{ fontSize: 11, color: "var(--text3)" }}>saving…</span>}
              <button onClick={onResetGoal} style={{ background: "var(--accentBg)", border: "1px solid var(--accent)", borderRadius: 40, padding: "6px 10px", cursor: "pointer", fontSize: 11, color: "var(--accent)", fontFamily: "inherit", fontWeight: 700 }}>⚙ Goals</button>
              <button onClick={() => setDark((d) => !d)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 40, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "var(--text2)" }}>{dark ? "☀️" : "🌙"}</button>
              <button onClick={onLogout} title="Logout" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 40, padding: "6px 10px", cursor: "pointer", fontSize: 16, color: "var(--text3)", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {desktop && (
          <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{navTabs.find((t) => t.id===activeTab)?.icon} {navTabs.find((t) => t.id===activeTab)?.label}</div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>Welcome Back, {user.name}</div>
            </div>
            {syncing && <span style={{ fontSize: 12, color: "var(--text3)" }}>☁️ Saving…</span>}
          </div>
        )}
        {panels[activeTab]}
      </div>
      {!desktop && <BottomNav />}
    </div>
  );
}