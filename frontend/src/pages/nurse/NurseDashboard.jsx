import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ClipboardCheck, AlertTriangle, Bell, UserPlus, ClipboardList, Eye, Send } from "lucide-react";
import { Card, KPICard, Modal, EmptyState, RiskBadge, StatusBadge, Button } from "../../components/ui.jsx";
import { DiseaseDonut, RiskTrend, DiseaseDistribution } from "../../components/Charts.jsx";
import { C, DISEASES, classify, fmtDate, todayStr } from "../../constants.js";
import * as api from "../../lib/api.js";
import AddPatientForm from "./AddPatientForm.jsx";

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalRows, setModalRows] = useState([]);

  useEffect(() => {
  api.getKpis().then(setKpis);
  api.listScreenings().then(setScreenings);
  api.listPatients().then(setPatients);
  }, []);

  const patientName = (id) => patients.find((p) => p.id === id)?.name || "Unknown";

  const openModal = async (type) => {
    setModal(type);
    if (type === "totalPatients") setModalRows(patients);
    if (type === "today") setModalRows(screenings.filter((s) => s.date === todayStr()));
    if (type === "highRisk") {
      const refs = await api.listReferrals();
      setModalRows(refs.filter((r) => r.risk_level === "High"));
    }
    if (type === "pending") {
      const refs = await api.listReferrals();
      setModalRows(refs.filter((r) => r.status !== "Signed"));
    }
  };

  if (!kpis) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Nurse Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textFaint }}>Screening desk overview and early referral status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModal("addPatient")}><UserPlus size={16} /> Add New Patient</Button>
          <Button onClick={() => navigate("/screening")}><ClipboardList size={16} /> New Screening</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <KPICard icon={Users} label="Total Patients" value={kpis.total_patients} sub="All registered patients" onClick={() => openModal("totalPatients")} />
        <KPICard icon={ClipboardCheck} label="Today's Screenings" value={kpis.today_screenings} sub={todayStr()} color={C.accent} onClick={() => openModal("today")} />
        <KPICard icon={AlertTriangle} label="High Risk Cases" value={kpis.high_risk_patients} color={C.high} onClick={() => openModal("highRisk")} />
        <KPICard icon={Bell} label="Pending Doctor Reviews" value={kpis.pending_reviews} color={C.moderate} onClick={() => openModal("pending")} />
      </div>

      <div className="flex flex-wrap gap-5">
        <DiseaseDonut />
        <RiskTrend diseases={DISEASES} />
      </div>
      <div className="flex flex-wrap gap-5">
        <DiseaseDistribution diseases={DISEASES} />
        <Card className="p-5 flex-1 min-w-[340px]">
          <div className="font-bold text-sm mb-3" style={{ color: C.text }}>Recent Screenings</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: C.textFaint }}>
                  <th className="pb-2 font-semibold">Patient ID</th><th className="pb-2 font-semibold">Name</th>
                  <th className="pb-2 font-semibold">Date</th><th className="pb-2 font-semibold">Vitals</th><th className="pb-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {[...screenings].slice(0, 6).map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: C.border }}>
                    <td className="py-2 mono text-xs" style={{ color: C.textFaint }}>{s.id}</td>
                    <td className="py-2 font-semibold" style={{ color: C.text }}>{patientName(s.patient_id)}</td>
                    <td className="py-2 text-xs" style={{ color: C.textMuted }}>{fmtDate(s.date)}</td>
                    <td className="py-2 text-xs" style={{ color: C.textMuted }}>BP {s.systolic}/{s.diastolic} · BMI {s.bmi}</td>
                    <td className="py-2"><button onClick={() => navigate("/archive")} className="text-xs font-semibold" style={{ color: C.primary }}>View report</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {screenings.length === 0 && <EmptyState text="No screenings recorded yet" />}
          </div>
        </Card>
      </div>

      {(modal === "totalPatients" || modal === "today") && (
        <Modal title={modal === "totalPatients" ? "All Patients" : "Today's Screenings"} onClose={() => setModal(null)} wide>
          {modalRows.length === 0 ? <EmptyState text="Nothing to show" /> : (
            <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {modalRows.map((p) => (
                <div key={p.id} className="p-3 rounded-xl border" style={{ borderColor: C.border }}>
                  <div className="font-bold text-sm" style={{ color: C.text }}>{p.name || patientName(p.patient_id)}</div>
                  {p.age && <div className="text-xs mt-1" style={{ color: C.textMuted }}>{p.age}y · {p.gender} · {p.phone}</div>}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
      {(modal === "highRisk" || modal === "pending") && (
        <Modal title={modal === "highRisk" ? "High Risk Patients" : "Pending Doctor Reviews"} onClose={() => setModal(null)} wide>
          {modalRows.length === 0 ? <EmptyState text="Nothing to show" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left" style={{ color: C.textFaint }}><th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Specialist</th><th className="pb-2">Status</th></tr></thead>
              <tbody>
                {modalRows.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: C.border }}>
                    <td className="py-2 font-semibold" style={{ color: C.text }}>{patientName(r.patient_id)}</td>
                    <td className="py-2 text-xs" style={{ color: C.textMuted }}>{r.disease}</td>
                    <td className="py-2 font-bold text-xs" style={{ color: C.high }}>{r.risk_percent}%</td>
                    <td className="py-2 text-xs" style={{ color: C.textMuted }}>{r.specialist_role}</td>
                    <td className="py-2"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
      {modal === "addPatient" && (
        <Modal title="Register New Patient" onClose={() => setModal(null)}>
          <AddPatientForm onSaved={() => { setModal(null); refresh(); }} />
        </Modal>
      )}
    </div>
  );
}
