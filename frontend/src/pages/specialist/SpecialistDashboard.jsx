import React, { useState, useEffect } from "react";
import { AlertTriangle, UserPlus, ClipboardCheck, FlaskConical } from "lucide-react";
import { KPICard, Modal, RiskBadge, StatusBadge } from "../../components/ui.jsx";
import { DiseaseDonut, RiskTrend } from "../../components/Charts.jsx";
import { C, ROLE_DISEASES } from "../../constants.js";
import { useAuth } from "../../context/AuthContext.jsx";
import * as api from "../../lib/api.js";
import ReferralReviewModal from "./ReferralReviewModal.jsx";

export default function SpecialistDashboard() {
  const { session } = useAuth();
  const diseases = ROLE_DISEASES[session.role];
  const [kpis, setKpis] = useState(null);
  const [modal, setModal] = useState(null);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState({});
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
  api.getKpis(session.role).then(setKpis);
  }, [session.role]);

  useEffect(() => {
    api.listPatients().then((ps) => {
      const map = {};
      ps.forEach((p) => (map[p.id] = p.name));
      setPatients(map);
    });
  }, []);

  const refresh = async () => {
  const refs = await api.listReferrals({ role: session.role });

  if (modal === "high") {
    setRows(refs.filter((r) => r.risk_level === "High"));
  } else if (modal === "today") {
    const today = new Date().toISOString().slice(0, 10);
    setRows(refs.filter((r) => r.created_at.slice(0, 10) === today));
  } else if (modal === "pending") {
    setRows(refs.filter((r) => r.status !== "Signed"));
  } else if (modal === "labs") {
    setRows(refs);
  }

  api.getKpis(session.role).then(setKpis);
  };

  const openModal = async (type) => {
    setModal(type);
    const refs = await api.listReferrals({ role: session.role });
    if (type === "high") setRows(refs.filter((r) => r.risk_level === "High"));
    if (type === "today") {
      const today = new Date().toISOString().slice(0, 10);
      setRows(refs.filter((r) => r.created_at.slice(0, 10) === today));
    }
    if (type === "pending") setRows(refs.filter((r) => r.status !== "Signed"));
    if (type === "labs") setRows(refs); // scheduled labs handled via /lab-tests view
  };

  if (!kpis) return null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>{session.role} Dashboard</h1>
      <div className="flex flex-wrap gap-4">
        <KPICard icon={AlertTriangle} label="High Risk Patients" value={kpis.high_risk} color={C.high} onClick={() => openModal("high")} />
        <KPICard icon={UserPlus} label="New Referrals Today" value={kpis.new_today} color={C.accent} onClick={() => openModal("today")} />
        <KPICard icon={ClipboardCheck} label="Pending Reviews" value={kpis.pending} color={C.moderate} onClick={() => openModal("pending")} />
        <KPICard icon={FlaskConical} label="Scheduled Lab Tests" value={kpis.scheduled_labs} color={C.primary} onClick={() => openModal("labs")} />
      </div>
      <div className="flex flex-wrap gap-5">
        <DiseaseDonut role={session.role} />
        <RiskTrend diseases={diseases} />
      </div>

      {modal && (
        <Modal title={modal === "high" ? "High Risk Patients" : modal === "today" ? "New Referrals Today" : modal === "pending" ? "Pending Reviews" : "Scheduled Lab Tests"} onClose={() => setModal(null)} wide>
          <table className="w-full text-sm">
            <thead><tr className="text-left" style={{ color: C.textFaint }}><th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Status</th><th className="pb-2"></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-2 font-semibold" style={{ color: C.text }}>{patients[r.patient_id] || "—"}</td>
                  <td className="py-2 text-xs" style={{ color: C.textMuted }}>{r.disease}</td>
                  <td className="py-2 text-xs font-bold" style={{ color: C.high }}>{r.risk_percent}%</td>
                  <td className="py-2"><StatusBadge status={r.status} /></td>
                  <td className="py-2"><button onClick={() => { setModal(null); setReviewing(r.id); }} className="text-xs font-semibold" style={{ color: C.primary }}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
      {reviewing && <ReferralReviewModal referralId={reviewing} onClose={() => setReviewing(null)} onSigned={refresh} />}
    </div>
  );
}
