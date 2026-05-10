import { useState } from "react";

function calcMifflin({ weight, height, age, gender, activity, goal, steps = "5000" }) {
  const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
  const actMultiplier = parseFloat(activity.replace("-none", ""));
  const bmr = gender === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const stepsBonus = { 2000: 0, 5000: 50, 8000: 100, 10000: 150 }[steps] ?? 0;
  const tdee = Math.round(bmr * actMultiplier * 0.81) + stepsBonus;
  let cal, pro, fat;
  if (goal === "lose") {
    cal = tdee - 450; pro = Math.round(w * 1.9); fat = Math.round((cal * 0.25) / 9);
  } else {
    cal = tdee + 400; pro = Math.round(w * 1.8); fat = Math.round((cal * 0.28) / 9);
  }
  return { bmr: Math.round(bmr), tdee, cal: Math.max(cal, 1200), pro, fat };
}

export default function OnboardingPage({ onComplete, dark, setDark, isEditingGoals, onCancelEdit }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [form, setForm] = useState({ age: "", gender: "male", weight: "", height: "", activity: "1.55", training: "balanced", targetWeight: "", steps: "5000" });
  const [calculated, setCalculated] = useState(null);
  const [manualTargets, setManualTargets] = useState({ cal: 0, pro: 0, fat: 0 });
  const [error, setError] = useState("");

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const inp = { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "var(--text)", fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };
  const sel = { ...inp, cursor: "pointer" };

  function nextStep() {
    setError("");
    if (step === 0 && !goal) { setError("Please select a goal"); return; }
    if (step === 1 && (!form.age || !form.weight || !form.height)) { setError("Please fill all fields"); return; }
    if (step === 2) {
      if (form.targetWeight) {
        const current = parseFloat(form.weight), target = parseFloat(form.targetWeight);
        if (!isNaN(current) && !isNaN(target)) {
          if (goal === "lose" && target >= current) { setError(`For fat loss target must be less than ${current} kg.`); return; }
          if (goal === "gain" && target <= current) { setError(`For muscle gain target must be greater than ${current} kg.`); return; }
        }
      }
      const res = calcMifflin({ ...form, goal });
      setCalculated(res);
      setManualTargets({ cal: res.cal, pro: res.pro, fat: res.fat });
      setStep(3); return;
    }
    if (step < 2) setStep((s) => s + 1);
  }

  function confirm() {
    onComplete({ goal, profile: form, targets: { cal: Number(manualTargets.cal), pro: Number(manualTargets.pro), fat: Number(manualTargets.fat) } });
  }

  const cardStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 8px 32px rgba(26,24,20,.12)" };
  const nextBtn = { width: "100%", background: "var(--accent)", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "'DM Sans',sans-serif", marginTop: 18 };
  const backBtn = { background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", marginTop: 10, width: "100%", textAlign: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, color: "var(--text)" }}>Vitals</div>
        <div style={{ fontSize: 12, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 4 }}>
          {isEditingGoals ? "Edit Goals & Targets" : "Your nutrition companion"}
        </div>
      </div>

      {isEditingGoals && onCancelEdit && (
        <button onClick={onCancelEdit} style={{ marginBottom: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text2)", fontFamily: "'DM Sans',sans-serif" }}>
          ← Back to Dashboard
        </button>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[0,1,2,3].map((i) => (
          <div key={i} style={{ height: 6, borderRadius: 99, background: step === i ? "var(--accent)" : "var(--border2)", width: step === i ? 22 : 6, transition: "all .3s" }} />
        ))}
      </div>

      <div style={cardStyle}>
        {step === 0 && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>What's your goal?</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 22, lineHeight: 1.6 }}>We'll use this to calculate your ideal calorie and macro targets.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ id: "lose", icon: "🔥", label: "Lose Fat", sub: "Caloric deficit" }, { id: "gain", icon: "💪", label: "Gain Muscle", sub: "Caloric surplus" }].map((g) => (
                <div key={g.id} onClick={() => setGoal(g.id)} style={{ border: `1.5px solid ${goal === g.id ? "var(--accent)" : "var(--border2)"}`, background: goal === g.id ? "var(--accentBg)" : "var(--surface2)", borderRadius: 12, padding: "18px 14px", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{g.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: goal === g.id ? "var(--accent)" : "var(--text)" }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{g.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>About you</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>Used to estimate your base metabolic rate (BMR) via Mifflin-St Jeor.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ label: "Age", key: "age", placeholder: "25" }, { label: "Weight (kg)", key: "weight", placeholder: "75" }, { label: "Height (cm)", key: "height", placeholder: "175" }].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{f.label}</div>
                  <input type="number" placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setF(f.key, e.target.value)} style={inp} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Gender</div>
                <select value={form.gender} onChange={(e) => setF("gender", e.target.value)} style={sel}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Your activity level</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>Helps us calculate your TDEE.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Exercise days per week</div>
                <select value={form.activity} onChange={(e) => { setF("activity", e.target.value); if (e.target.value === "1.2-none") setF("training", "none"); }} style={sel}>
                  <option value="1.2-none">No exercise (completely sedentary)</option>
                  <option value="1.2">Sedentary (desk job, light walking)</option>
                  <option value="1.375">Lightly active (1–2 days/week)</option>
                  <option value="1.55">Moderately active (3–4 days/week)</option>
                  <option value="1.725">Very active (5–6 days/week)</option>
                  <option value="1.9">Athlete (daily intense training)</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Primary training type</div>
                <select value={form.training} onChange={(e) => setF("training", e.target.value)} disabled={form.activity === "1.2-none"} style={{ ...sel, opacity: form.activity === "1.2-none" ? 0.4 : 1 }}>
                  {form.activity === "1.2-none" && <option value="none">None</option>}
                  <option value="balanced">Balanced (cardio + strength)</option>
                  <option value="strength">Strength / Weight training</option>
                  <option value="cardio">Cardio dominant</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Daily Steps (average)</div>
                <select value={form.steps} onChange={(e) => setF("steps", e.target.value)} style={sel}>
                  <option value="2000">Under 3,000 (barely moving)</option>
                  <option value="5000">3,000–6,000 (light daily movement)</option>
                  <option value="8000">6,000–9,000 (moderately active)</option>
                  <option value="10000">10,000+ (very active daily)</option>
                </select>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    {goal === "lose" ? "Target weight (kg)" : "Goal weight to reach (kg)"}
                  </div>
                  {form.targetWeight && form.weight && (() => {
                    const cur = parseFloat(form.weight), tgt = parseFloat(form.targetWeight);
                    if (isNaN(cur) || isNaN(tgt)) return null;
                    if (goal === "lose" && tgt >= cur) return <div style={{ fontSize: 11, color: "var(--blue,#2563EB)", fontWeight: 600 }}>Must be less than {cur} kg</div>;
                    if (goal === "gain" && tgt <= cur) return <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>Must be greater than {cur} kg</div>;
                    return null;
                  })()}
                </div>
                <input type="number" placeholder={goal === "lose" ? "e.g. 68" : "e.g. 80"} step="0.1" value={form.targetWeight}
                  onChange={(e) => { setF("targetWeight", e.target.value); setError(""); }}
                  style={{ ...inp, border: (() => {
                    if (!form.targetWeight || !form.weight) return "1px solid var(--border2)";
                    const cur = parseFloat(form.weight), tgt = parseFloat(form.targetWeight);
                    if (isNaN(cur) || isNaN(tgt)) return "1px solid var(--border2)";
                    if (goal === "lose" && tgt >= cur) return "1.5px solid var(--accent)";
                    if (goal === "gain" && tgt <= cur) return "1.5px solid var(--accent)";
                    return "1.5px solid var(--green)";
                  })() }}
                />
                {(() => {
                  if (!form.targetWeight || !form.weight) return null;
                  const cur = parseFloat(form.weight), tgt = parseFloat(form.targetWeight);
                  if (isNaN(cur) || isNaN(tgt)) return null;
                  if (goal === "lose" && tgt >= cur) return <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 5, fontWeight: 600 }}>⚠ Target must be below {cur} kg for fat loss</div>;
                  if (goal === "gain" && tgt <= cur) return <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 5, fontWeight: 600 }}>⚠ Target must be above {cur} kg for muscle gain</div>;
                  return <div style={{ fontSize: 11, color: "var(--green)", marginTop: 5, fontWeight: 600 }}>✓ Looks good!</div>;
                })()}
              </div>
            </div>
          </>
        )}

        {step === 3 && calculated && (
          <>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "var(--text)", marginBottom: 6 }}>Your targets</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>Calculated via Mifflin-St Jeor formula — edit any value if you prefer different targets.</div>
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "var(--text2)", lineHeight: 2 }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>BMR:</span> {calculated.bmr} kcal &nbsp;·&nbsp;
              <span style={{ fontWeight: 700, color: "var(--text)" }}>TDEE:</span> {calculated.tdee} kcal<br />
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{goal === "lose" ? "Deficit" : "Surplus"}:</span> {Math.abs(calculated.tdee - calculated.cal)} kcal/day &nbsp;·&nbsp;
              <span style={{ fontWeight: 700, color: goal === "lose" ? "var(--green)" : "var(--accent)" }}>
                ~{Math.abs(((calculated.tdee - calculated.cal) * 7) / 7700).toFixed(2)} kg/week {goal === "lose" ? "loss" : "gain"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
              {[{ key: "cal", label: "kcal / day", color: "var(--accent)" }, { key: "pro", label: "Protein (g)", color: "var(--green)" }, { key: "fat", label: "Fat (g)", color: "var(--amber)" }].map((f) => (
                <div key={f.key} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                  <input type="number" value={manualTargets[f.key]} onChange={(e) => setManualTargets((t) => ({ ...t, [f.key]: e.target.value }))}
                    style={{ background: "none", border: "none", fontSize: 22, fontWeight: 700, color: f.color, textAlign: "center", width: "100%", fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text3)", fontWeight: 600 }}>{f.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>Tap any number above to edit manually</div>
          </>
        )}

        {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, background: "var(--accentBg)", padding: "8px 12px", borderRadius: 8, marginTop: 12 }}>{error}</div>}

        <button onClick={step === 3 ? confirm : nextStep} style={nextBtn}>
          {step === 2 ? "Calculate my targets →" : step === 3 ? "Start tracking →" : "Continue →"}
        </button>
        {step > 0 && <button onClick={() => { setError(""); setStep((s) => s - 1); }} style={backBtn}>← Back</button>}
      </div>

      <button onClick={() => setDark((d) => !d)} style={{ marginTop: 20, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text3)", fontFamily: "'DM Sans',sans-serif" }}>
        {dark ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
      </button>
    </div>
  );
}
