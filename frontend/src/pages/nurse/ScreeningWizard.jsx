import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Upload, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, Field, Button, Modal, RiskBadge, inputCls, inputStyle } from "../../components/ui.jsx";
import { C, DISEASES, DISEASE_COLOR, classify, riskColor, riskBg } from "../../constants.js";
import * as api from "../../lib/api.js";

const STEPS = ["Select Patient", "Personal Details", "Lifestyle History", "Family History", "Clinical Vitals", "Symptoms Checklist", "Screen & Report"];
const SYMPTOM_LIST = ["Chest Pain", "Frequent Urination", "Fatigue", "Breathlessness", "Headache", "Vision Problems"];
const DISEASE_ICON_LABEL = { Diabetes: "🩸", Hypertension: "❤️", CVD: "💓", Stroke: "🧠", CKD: "🫘" };

function computeBMI(h, w) {
  return h && w ? +(w / ((h / 100) * (h / 100))).toFixed(1) : 0;
}

function dietPlan() {
  return {
    Breakfast: "Vegetable oats / whole-grain upma + a boiled egg or sprouts + black coffee/tea (no sugar)",
    "Mid-morning": "A fresh fruit (apple, guava, or papaya) + a handful of nuts",
    Lunch: "Brown rice or 2 multigrain rotis + dal + a green vegetable + curd (small bowl)",
    Evening: "Roasted chana / makhana + green tea",
    Dinner: "Grilled fish/chicken or paneer + salad + 1 roti; avoid heavy carbs late at night",
    Hydration: "2.5–3 litres of water daily; avoid sugary or carbonated beverages",
  };
}

export default function ScreeningWizard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [step, setStep] = useState(0);
  const [patientId, setPatientId] = useState("");
  const [personal, setPersonal] = useState({ height: "", weight: "" });
  const [lifestyle, setLifestyle] = useState({ smoking: "None", alcohol: "None", activity: "Moderate", diet: "Average", sleep: 7, stress: "Low" });
  const [family, setFamily] = useState({ diabetes: false, hypertension: false, heartDisease: false, stroke: false, ckd: false });
  const [vitals, setVitals] = useState({ systolic: "", diastolic: "", heartRate: "" });
  const [files, setFiles] = useState({ ecg: null, retinal: null });
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [dietModal, setDietModal] = useState(false);
  const [lifestyleModal, setLifestyleModal] = useState(false);

  const [mlDetails, setMlDetails] = useState(null);

  useEffect(() => { api.listPatients().then(setPatients); }, []);

  const patient = patients.find((p) => p.id === patientId);
  const bmi = computeBMI(+personal.height, +personal.weight);

  const runScreening = async () => {
    setRunning(true);
    try {
      const payload = {
        patient_id: patientId,
        height_cm: +personal.height,
        weight_kg: +personal.weight,
        smoking: lifestyle.smoking, alcohol: lifestyle.alcohol, activity: lifestyle.activity,
        diet: lifestyle.diet, sleep_hours: +lifestyle.sleep, stress: lifestyle.stress,
        family_diabetes: family.diabetes, family_hypertension: family.hypertension,
        family_heart_disease: family.heartDisease, family_stroke: family.stroke, family_ckd: family.ckd,
        systolic: +vitals.systolic, diastolic: +vitals.diastolic, heart_rate: +vitals.heartRate,
        ecg_file: files.ecg, retinal_file: files.retinal,
        symptoms, notes,
      };
      const data = await api.createScreening(payload);
      setResult(data);
      try {
        const details = await api.getScreeningMLDetails(data.screening.id);
        setMlDetails(details);
      } catch (e) {
        console.error("ML details fetch error:", e);
      }
    } finally {
      setRunning(false);
    }
  };

  const toggleSymptom = (s) => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const canNext = [!!patientId, personal.height && personal.weight, true, true, vitals.systolic && vitals.diastolic && vitals.heartRate, true][step];

  if (result) {
    const scores = {
      Diabetes: result.risk_report.diabetes_pct, Hypertension: result.risk_report.hypertension_pct,
      CVD: result.risk_report.cvd_pct, Stroke: result.risk_report.stroke_pct, CKD: result.risk_report.ckd_pct,
    };
    const anyReferral = result.referrals.length > 0;
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Sparkles size={20} style={{ color: C.accent }} />
          <h1 className="text-xl font-extrabold" style={{ color: C.text }}>AI Risk Report — {patient?.name}</h1>
        </div>
        <Card className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DISEASES.map((d) => {
              const score = scores[d];
              const level = classify(score);
              return (
                <div key={d} className="p-3 rounded-xl text-center" style={{ backgroundColor: riskBg(level) }}>
                  <div className="text-lg mb-1">{DISEASE_ICON_LABEL[d]}</div>
                  <div className="text-xs font-semibold" style={{ color: C.textMuted }}>{d}</div>
                  <div className="text-2xl font-extrabold" style={{ color: riskColor(level) }}>{score}%</div>
                  <RiskBadge level={level} />
                </div>
              );
            })}
          </div>
        </Card>

        {mlDetails && (
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: C.text }}>
              <Sparkles size={16} style={{ color: C.accent }} /> ML Model Explainability & Clinical Feature Attribution (SHAP)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(mlDetails.ml_predictions).map(([dis, pred]) => (
                <div key={dis} className="p-3 rounded-lg border text-xs" style={{ borderColor: C.border }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm" style={{ color: C.text }}>{dis}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {pred.model_used}
                    </span>
                  </div>
                  {pred.explanation && (
                    <div className="space-y-1.5 mb-2">
                      {Object.entries(pred.explanation).map(([feat, pct]) => (
                        <div key={feat} className="flex justify-between items-center">
                          <span style={{ color: C.textMuted }}>{feat}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, pct * 100)}%` }}></div>
                            </div>
                            <span className="font-semibold" style={{ color: C.text }}>{Math.round(pct * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {pred.recommendations && pred.recommendations.length > 0 && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: C.border }}>
                      <div className="font-semibold mb-1" style={{ color: C.text }}>Recommendations:</div>
                      <ul className="list-disc list-inside space-y-0.5" style={{ color: C.textMuted }}>
                        {pred.recommendations.slice(0, 2).map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {anyReferral ? (
          <Card className="p-5" style={{ backgroundColor: C.moderateBg }}>
            <div className="font-bold text-sm mb-2" style={{ color: C.text }}>Auto specialist referral triggered</div>
            {result.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-t first:border-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="text-sm" style={{ color: C.text }}><b>{r.disease}</b> ({r.risk_percent}%) → {r.specialist_role}</div>
                <RiskBadge level={r.risk_level} />
              </div>
            ))}
            <p className="text-xs mt-2" style={{ color: C.textMuted }}>Reports have been sent to the assigned specialist dashboards, and a notification has been raised for each.</p>
          </Card>
        ) : (
          <Card className="p-5" style={{ backgroundColor: C.lowBg }}>
            <div className="font-bold text-sm mb-3" style={{ color: C.text }}>All markers are Low risk — no referral needed</div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setLifestyleModal(true)}>Generate Lifestyle Recommendation</Button>
              <Button variant="outline" onClick={() => setDietModal(true)}>Generate Diet Plan</Button>
              <Button variant="ghost" onClick={() => navigate("/")}>Archive Report</Button>
            </div>
          </Card>
        )}
        <Button onClick={() => navigate("/")} className="self-start"><CheckCircle2 size={16} /> Back to Dashboard</Button>


        {lifestyleModal && (
          <Modal title="Lifestyle Recommendation" onClose={() => setLifestyleModal(false)}>
            <ul className="space-y-2 text-sm" style={{ color: C.text }}>
              {[
                `Hi ${patient?.name}, your latest screening shows your NCD risk is well controlled — keep it up.`,
                "Maintain 150+ minutes of moderate physical activity per week (brisk walking, cycling, or swimming).",
                "Keep sodium intake under 5g/day and favour whole grains, vegetables, and lean protein.",
                "Sleep 7–8 hours a night and manage stress with breathing exercises or light yoga.",
                "Avoid tobacco and limit alcohol to occasional, moderate amounts.",
                "Recheck your NCD screening in 6 months, or sooner if new symptoms appear.",
              ].map((l, i) => (
                <li key={i} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: C.low }} />{l}</li>
              ))}
            </ul>
          </Modal>
        )}
        {dietModal && (
          <Modal title="Personalized Diet Plan" onClose={() => setDietModal(false)}>
            <div className="space-y-3">
              {Object.entries(dietPlan()).map(([slot, meal]) => (
                <div key={slot} className="p-3 rounded-lg" style={{ backgroundColor: C.primaryLighter }}>
                  <div className="text-xs font-bold uppercase tracking-wide" style={{ color: C.primary }}>{slot}</div>
                  <div className="text-sm mt-1" style={{ color: C.text }}>{meal}</div>
                </div>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <h1 className="text-xl font-extrabold" style={{ color: C.text }}>
        Clinical Assessment Engine <span className="font-normal text-sm" style={{ color: C.textFaint }}>— AI Early NCD Risk Screening</span>
      </h1>
      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: i <= step ? C.primary : C.border, color: i <= step ? "#fff" : C.textFaint }}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className="w-6 h-0.5" style={{ backgroundColor: i < step ? C.primary : C.border }} />}
          </div>
        ))}
      </div>
      <Card className="p-6">
        <div className="font-bold mb-4" style={{ color: C.text }}>{STEPS[step]}</div>

        {step === 0 && (
          <div>
            <Field label="Select Registered Patient">
              <select className={inputCls} style={inputStyle} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">— choose patient —</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.age}y · {p.gender}</option>)}
              </select>
            </Field>
            {patient && <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: C.primaryLighter, color: C.textMuted }}>{patient.phone} · {patient.address}</div>}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <Field label="Name"><input disabled className={inputCls} style={inputStyle} value={patient?.name || ""} /></Field>
              <Field label="Age"><input disabled className={inputCls} style={inputStyle} value={patient?.age || ""} /></Field>
            </div>
            <Field label="Gender"><input disabled className={inputCls} style={inputStyle} value={patient?.gender || ""} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (cm)"><input type="number" className={inputCls} style={inputStyle} value={personal.height} onChange={(e) => setPersonal({ ...personal, height: e.target.value })} /></Field>
              <Field label="Weight (kg)"><input type="number" className={inputCls} style={inputStyle} value={personal.weight} onChange={(e) => setPersonal({ ...personal, weight: e.target.value })} /></Field>
            </div>
            {bmi > 0 && <div className="text-xs" style={{ color: C.textMuted }}>Computed BMI: <b>{bmi}</b></div>}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Smoking">
              <select className={inputCls} style={inputStyle} value={lifestyle.smoking} onChange={(e) => setLifestyle({ ...lifestyle, smoking: e.target.value })}>
                <option>None</option><option>Occasional</option><option>Regular</option>
              </select>
            </Field>
            <Field label="Alcohol">
              <select className={inputCls} style={inputStyle} value={lifestyle.alcohol} onChange={(e) => setLifestyle({ ...lifestyle, alcohol: e.target.value })}>
                <option>None</option><option>Occasional</option><option>Regular</option>
              </select>
            </Field>
            <Field label="Physical Activity">
              <select className={inputCls} style={inputStyle} value={lifestyle.activity} onChange={(e) => setLifestyle({ ...lifestyle, activity: e.target.value })}>
                <option>Low</option><option>Moderate</option><option>High</option>
              </select>
            </Field>
            <Field label="Diet">
              <select className={inputCls} style={inputStyle} value={lifestyle.diet} onChange={(e) => setLifestyle({ ...lifestyle, diet: e.target.value })}>
                <option>Poor</option><option>Average</option><option>Good</option>
              </select>
            </Field>
            <Field label="Sleep Duration (hrs)"><input type="number" className={inputCls} style={inputStyle} value={lifestyle.sleep} onChange={(e) => setLifestyle({ ...lifestyle, sleep: +e.target.value })} /></Field>
            <Field label="Stress Level">
              <select className={inputCls} style={inputStyle} value={lifestyle.stress} onChange={(e) => setLifestyle({ ...lifestyle, stress: e.target.value })}>
                <option>Low</option><option>Moderate</option><option>High</option>
              </select>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-3">
            {["diabetes", "hypertension", "heartDisease", "stroke", "ckd"].map((k) => (
              <label key={k} className="flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer" style={{ borderColor: C.border }}>
                <input type="checkbox" checked={family[k]} onChange={(e) => setFamily({ ...family, [k]: e.target.checked })} />
                {k === "heartDisease" ? "Heart Disease" : k === "ckd" ? "CKD" : k[0].toUpperCase() + k.slice(1)}
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="BP Systolic"><input type="number" className={inputCls} style={inputStyle} value={vitals.systolic} onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })} /></Field>
              <Field label="BP Diastolic"><input type="number" className={inputCls} style={inputStyle} value={vitals.diastolic} onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })} /></Field>
              <Field label="Heart Rate (bpm)"><input type="number" className={inputCls} style={inputStyle} value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} /></Field>
            </div>
            <div className="text-xs mb-4" style={{ color: C.textMuted }}>BMI (from personal details): <b>{bmi}</b></div>
            <div className="grid grid-cols-2 gap-3">
              {["ecg", "retinal"].map((k) => (
                <Field key={k} label={k === "ecg" ? "ECG Upload" : "Retinal Scan Upload"}>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer" style={{ borderColor: C.border, color: C.textMuted }}>
                    <Upload size={15} />
                    {files[k] ? files[k] : "Choose file..."}
                    <input type="file" className="hidden" onChange={(e) => setFiles({ ...files, [k]: e.target.files[0]?.name || null })} />
                  </label>
                </Field>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SYMPTOM_LIST.map((s) => (
                <label key={s} className="flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer" style={{ borderColor: C.border }}>
                  <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleSymptom(s)} /> {s}
                </label>
              ))}
            </div>
            <Field label="Nurse Notes (optional)"><textarea className={inputCls} style={inputStyle} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional observations for the reviewing specialist..." /></Field>
          </div>
        )}

        {step === 6 && (
          <div className="text-center py-6">
            <Sparkles size={30} className="mx-auto mb-3" style={{ color: C.accent }} />
            <p className="text-sm mb-4" style={{ color: C.textMuted }}>
              Ready to run AI risk prediction across Diabetes, Hypertension, CVD, Stroke and CKD for <b>{patient?.name}</b>.
            </p>
            <Button onClick={runScreening} disabled={running} className="mx-auto">
              <Sparkles size={16} /> {running ? "Analyzing..." : "Screen & Generate Report"}
            </Button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={16} /> Back</Button>
          {step < STEPS.length - 1 && <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>Next <ChevronRight size={16} /></Button>}
        </div>
      </Card>
    </div>
  );
}
