import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, HeartPulse, Stethoscope, Droplets, Brain, Activity, ShieldCheck } from "lucide-react";
import { C, ROLES } from "../constants.js";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_ICON = { Nurse: Stethoscope, Endocrinologist: Droplets, Cardiologist: HeartPulse, Neurologist: Brain, Nephrologist: Activity, "Super Admin": ShieldCheck };
const ROLE_EMAIL = {
  Nurse: "nurse@healthsense.ai",
  Endocrinologist: "endocrinologist@healthsense.ai",
  Cardiologist: "cardiologist@healthsense.ai",
  Neurologist: "neurologist@healthsense.ai",
  Nephrologist: "nephrologist@healthsense.ai",
  "Super Admin": "admin@healthsense.ai",
};

export default function Login() {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const pickRole = (r) => {
    setRole(r);
    setEmail(ROLE_EMAIL[r]);
    setError("");
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (e) {
      setError(e?.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.primaryDeep }}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <HeartPulse size={16} style={{ color: C.accent }} />
            <span className="text-xs font-semibold tracking-wide text-white/80">HOSPITAL NCD SCREENING NETWORK</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">HealthSense <span style={{ color: C.accent }}>AI</span></h1>
          <p className="text-white/60 text-sm">Early detection. Automatic referral. One shared record from screening to signature.</p>
        </div>

        <div className="rounded-3xl p-6 md:p-8" style={{ backgroundColor: C.card }}>
          <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: C.textFaint }}>Select your portal</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {ROLES.map((r) => {
              const Icon = ROLE_ICON[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => pickRole(r)}
                  className="text-left p-4 rounded-2xl border transition-all"
                  style={{ borderColor: active ? C.primary : C.border, backgroundColor: active ? C.primaryLight : "#fff" }}
                >
                  <Icon size={20} style={{ color: active ? C.primary : C.textMuted }} />
                  <div className="mt-2 text-sm font-bold" style={{ color: C.text }}>{r}</div>
                </button>
              );
            })}
          </div>

          {role && (
            <div className="flex flex-col md:flex-row gap-3">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="md:flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.border }} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="md:w-48 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.border }} />
              <button
                onClick={submit}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 md:w-40 text-white disabled:opacity-60"
                style={{ backgroundColor: C.primary }}
              >
                {loading ? "Signing in..." : "Sign in"} <ChevronRight size={16} />
              </button>
            </div>
          )}
          {error && <p className="text-xs mt-3 font-semibold" style={{ color: C.high }}>{error}</p>}
          <p className="text-xs mt-4" style={{ color: C.textFaint }}>
            Demo credentials are pre-filled — password is <code>password123</code> for every seeded account. Replace the Users table with real accounts before going to production.
          </p>
        </div>
      </div>
    </div>
  );
}
