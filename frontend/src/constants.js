export const C = {
  primary: "#0E7C5A",
  primaryDark: "#0A5C43",
  primaryDeep: "#083F2E",
  primaryLight: "#E7F4EE",
  primaryLighter: "#F2F9F6",
  accent: "#12A886",
  bg: "#F5F8F7",
  card: "#FFFFFF",
  text: "#122420",
  textMuted: "#5C7069",
  textFaint: "#8CA098",
  border: "#DEE9E4",
  low: "#1E9E5A",
  lowBg: "#E9F8EF",
  moderate: "#C67C0E",
  moderateBg: "#FDF3E0",
  high: "#D64545",
  highBg: "#FBE9E9",
  diabetes: "#0E7C5A",
  hypertension: "#C6470E",
  cvd: "#B23A5B",
  stroke: "#6E4EC6",
  ckd: "#1C7FC6",
};

export const DISEASES = ["Diabetes", "Hypertension", "CVD", "Stroke", "CKD"];
export const DISEASE_COLOR = { Diabetes: C.diabetes, Hypertension: C.hypertension, CVD: C.cvd, Stroke: C.stroke, CKD: C.ckd };
export const SPECIALIST_MAP = { Diabetes: "Endocrinologist", Hypertension: "Cardiologist", CVD: "Cardiologist", Stroke: "Neurologist", CKD: "Nephrologist" };
export const LAB_TESTS_MAP = {
  Diabetes: ["HbA1c", "Fasting Blood Sugar", "PPBS"],
  Hypertension: ["ECG", "Lipid Profile", "Echocardiogram"],
  CVD: ["ECG", "Troponin", "Lipid Profile"],
  Stroke: ["MRI", "CT Scan"],
  CKD: ["Creatinine", "Urine Albumin", "eGFR"],
};
export const ROLES = ["Nurse", "Endocrinologist", "Cardiologist", "Neurologist", "Nephrologist", "Super Admin"];
export const ROLE_DISEASES = { Endocrinologist: ["Diabetes"], Cardiologist: ["Hypertension", "CVD"], Neurologist: ["Stroke"], Nephrologist: ["CKD"] };

export const classify = (score) => (score >= 71 ? "High" : score >= 41 ? "Moderate" : "Low");
export const riskColor = (level) => (level === "High" ? C.high : level === "Moderate" ? C.moderate : C.low);
export const riskBg = (level) => (level === "High" ? C.highBg : level === "Moderate" ? C.moderateBg : C.lowBg);
export const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
export const todayStr = () => new Date().toISOString().slice(0, 10);
