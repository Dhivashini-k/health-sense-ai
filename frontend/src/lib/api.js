import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hs_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("hs_token");
      localStorage.removeItem("hs_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const login = (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data);

// ---- Patients ----
export const listPatients = (q) => api.get("/patients", { params: { q } }).then((r) => r.data);
export const createPatient = (payload) => api.post("/patients", payload).then((r) => r.data);

// ---- Screenings ----
export const listScreenings = () => api.get("/screenings").then((r) => r.data);
export const createScreening = (payload) => api.post("/screenings", payload).then((r) => r.data);
export const getArchive = () => api.get("/screenings/archive").then((r) => r.data);

// ---- Referrals ----
export const listReferrals = (params) => api.get("/referrals", { params }).then((r) => r.data);
export const getReferral = (id) => api.get(`/referrals/${id}`).then((r) => r.data);
export const viewReferral = (id) => api.post(`/referrals/${id}/view`).then((r) => r.data);
export const signReferral = (id, payload) => api.post(`/referrals/${id}/sign`, payload).then((r) => r.data);
export const remindReferral = (id) => api.post(`/referrals/${id}/remind`).then((r) => r.data);

// ---- Notifications ----
export const listNotifications = (role) => api.get("/notifications", { params: { role } }).then((r) => r.data);

// ---- Lab tests ----
export const listLabOrders = (role) => api.get("/lab-tests", { params: { role } }).then((r) => r.data);

// ---- Analytics ----
export const getDiseaseOverview = (role) => api.get("/analytics/disease-overview", { params: { role } }).then((r) => r.data);
export const getRiskTrend = (disease, duration_days) => api.get("/analytics/risk-trend", { params: { disease, duration_days } }).then((r) => r.data);
export const getDistribution = (duration_days) => api.get("/analytics/distribution", { params: { duration_days } }).then((r) => r.data);
export const getKpis = (role) => api.get("/analytics/kpis", { params: { role } }).then((r) => r.data);

// ---- Assistant ----
export const chatWithAssistant = (role, messages) => api.post("/assistant/chat", { role, messages }).then((r) => r.data);
export const chatWithGemini = (patient_id, message) => api.post("/api/chat", { patient_id, message }).then((r) => r.data);

// ---- ML Models ----
export const getMLModelsStatus = () => api.get("/ml-models/status").then((r) => r.data);
export const getScreeningMLDetails = (id) => api.get(`/screenings/${id}/ml-details`).then((r) => r.data);

