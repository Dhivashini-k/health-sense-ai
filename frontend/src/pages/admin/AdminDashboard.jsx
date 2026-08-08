import React, { useState, useEffect } from "react";
import { Users, ClipboardList, ClipboardCheck, Stethoscope } from "lucide-react";
import { Card, KPICard, EmptyState, StatusBadge } from "../../components/ui.jsx";
import { DiseaseDonut, RiskTrend, DiseaseDistribution } from "../../components/Charts.jsx";
import { C, DISEASES, ROLE_DISEASES } from "../../constants.js";
import * as api from "../../lib/api.js";

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState({});

  useEffect(() => {
    api.getKpis().then(setKpis);
    api.listReferrals().then(setReferrals);
    api.listPatients().then((ps) => {
      const map = {};
      ps.forEach((p) => (map[p.id] = p.name));
      setPatients(map);
    });
  }, []);

  if (!kpis) return null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Global Analytics</h1>
      <div className="flex flex-wrap gap-4">
        <KPICard icon={Users} label="Total Patients" value={kpis.total_patients} />
        <KPICard icon={ClipboardList} label="Today's Screenings" value={kpis.today_screenings} color={C.accent} />
        <KPICard icon={ClipboardCheck} label="Pending Reviews" value={kpis.pending_reviews} color={C.moderate} />
        <KPICard icon={Stethoscope} label="Active Specialists" value={4} color={C.primary} />
      </div>
      <div className="flex flex-wrap gap-5">
        <DiseaseDonut />
        <DiseaseDistribution diseases={DISEASES} />
      </div>
      <RiskTrend diseases={DISEASES} />

      <Card className="p-5 overflow-x-auto">
        <div className="font-bold text-sm mb-3" style={{ color: C.text }}>Manage Reports — All Referrals</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: C.textFaint }}>
              <th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Risk %</th><th className="pb-2">Specialist</th><th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: C.border }}>
                <td className="py-2.5 font-semibold" style={{ color: C.text }}>{patients[r.patient_id] || "—"}</td>
                <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{r.disease}</td>
                <td className="py-2.5 text-xs font-bold" style={{ color: C.high }}>{r.risk_percent}%</td>
                <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{r.specialist_role}</td>
                <td className="py-2.5"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {referrals.length === 0 && <EmptyState text="No referrals yet" />}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(ROLE_DISEASES).map(([role, diseases]) => {
          const refs = referrals.filter((r) => diseases.includes(r.disease));
          return (
            <Card key={role} className="p-5">
              <div className="font-bold" style={{ color: C.text }}>{role}</div>
              <div className="text-xs mb-3" style={{ color: C.textFaint }}>Handles: {diseases.join(", ")}</div>
              <div className="flex gap-4 text-sm">
                <div><b>{refs.length}</b> <span style={{ color: C.textFaint }}>total</span></div>
                <div><b>{refs.filter((r) => r.status !== "Signed").length}</b> <span style={{ color: C.textFaint }}>pending</span></div>
                <div><b>{refs.filter((r) => r.status === "Signed").length}</b> <span style={{ color: C.textFaint }}>signed</span></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
