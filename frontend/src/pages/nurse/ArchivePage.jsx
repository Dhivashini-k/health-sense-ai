import React, { useState, useEffect } from "react";
import { Eye, Send } from "lucide-react";
import { Card, Modal, EmptyState, StatusBadge, RiskBadge } from "../../components/ui.jsx";
import { C, DISEASES, classify, riskColor, riskBg, fmtDate } from "../../constants.js";
import * as api from "../../lib/api.js";

export default function ArchivePage() {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
  api.getArchive().then(setRows);
  }, []);

  const sendReminder = async (row) => {
    await Promise.all(row.referrals.filter((r) => r.status !== "Signed").map((r) => api.remindReferral(r.id)));
    setToast("Reminder sent to specialist(s)");
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>NCD Risk Report Archive</h1>
      <Card className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: C.textFaint }}>
              <th className="pb-2">Patient</th>
              {DISEASES.map((d) => <th key={d} className="pb-2">{d}</th>)}
              <th className="pb-2">Specialist(s)</th><th className="pb-2">Date</th><th className="pb-2">Status</th><th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.screening_id} className="border-t" style={{ borderColor: C.border }}>
                <td className="py-2.5 font-semibold" style={{ color: C.text }}>{g.patient_name}</td>
                {DISEASES.map((d) => {
                  const val = g.risk[d] ?? 0;
                  return <td key={d} className="py-2.5 text-xs font-semibold" style={{ color: riskColor(classify(val)) }}>{val}%</td>;
                })}
                <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{g.specialists.join(", ") || "—"}</td>
                <td className="py-2.5 text-xs" style={{ color: C.textFaint }}>{fmtDate(g.date)}</td>
                <td className="py-2.5"><StatusBadge status={g.status} /></td>
                <td className="py-2.5">
                  <div className="flex gap-2">
                    <button onClick={() => setView(g)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.primary }}><Eye size={13} /> View</button>
                    {g.status === "Draft" && (
                      <button onClick={() => sendReminder(g)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.moderate }}><Send size={13} /> Remind</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState text="No reports yet" />}
      </Card>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white" style={{ backgroundColor: C.primaryDeep }}>
          {toast}
        </div>
      )}

      {view && (
        <Modal title={`Report — ${view.patient_name}`} onClose={() => setView(null)}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {DISEASES.map((d) => {
              const val = view.risk[d] ?? 0;
              const level = classify(val);
              return (
                <div key={d} className="p-2.5 rounded-lg text-center" style={{ backgroundColor: riskBg(level) }}>
                  <div className="text-[11px] font-semibold" style={{ color: C.textMuted }}>{d}</div>
                  <div className="text-lg font-extrabold" style={{ color: riskColor(level) }}>{val}%</div>
                </div>
              );
            })}
          </div>
          {view.referrals.length === 0 ? (
            <p className="text-sm" style={{ color: C.textMuted }}>All markers Low risk — archived with lifestyle guidance, no referral required.</p>
          ) : (
            <div className="space-y-2">
              {view.referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border text-sm" style={{ borderColor: C.border }}>
                  <span>{r.disease} → {r.specialist_role}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
