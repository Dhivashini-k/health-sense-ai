import React, { useState, useEffect } from "react";
import { Card, EmptyState, StatusBadge, Modal } from "../components/ui.jsx";
import { C, fmtDate } from "../constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../lib/api.js";

export default function LabTestsPage() {
  const { session } = useAuth();
  const scopeRole = session.role === "Nurse" ? undefined : session.role;
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState(null);

  useEffect(() => { api.listLabOrders(scopeRole).then(setOrders); }, [scopeRole]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Lab Test Module</h1>
      <Card className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: C.textFaint }}>
              <th className="pb-2">Patient</th><th className="pb-2">Disease</th><th className="pb-2">Ordered Tests</th><th className="pb-2">Date</th><th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.referral_id} className="border-t cursor-pointer hover:bg-gray-50" style={{ borderColor: C.border }} onClick={() => setView(o)}>
                <td className="py-2.5 font-semibold" style={{ color: C.text }}>{o.patient_name}</td>
                <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{o.disease}</td>
                <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{o.tests.join(", ")}</td>
                <td className="py-2.5 text-xs" style={{ color: C.textFaint }}>{o.signed_at ? fmtDate(o.signed_at) : "—"}</td>
                <td className="py-2.5"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <EmptyState text="No lab test orders yet" />}
      </Card>
      {view && (
        <Modal title={`Lab Order — ${view.patient_name}`} onClose={() => setView(null)}>
          <div className="text-sm space-y-3" style={{ color: C.text }}>
            <div className="text-xs" style={{ color: C.textMuted }}>Disease: {view.disease}</div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: C.primaryLighter }}>
              <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.primary }}>Signed Lab Tests</div>
              {(view.tests || []).map((t) => (<div key={t}>• {t}</div>))}
            </div>
            {view.signed_at && <div className="text-xs" style={{ color: C.textFaint }}>Signed {fmtDate(view.signed_at)}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
