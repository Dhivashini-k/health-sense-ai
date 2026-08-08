import React, { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { Card, EmptyState, RiskBadge, StatusBadge } from "../../components/ui.jsx";
import { C, ROLE_DISEASES } from "../../constants.js";
import { useAuth } from "../../context/AuthContext.jsx";
import * as api from "../../lib/api.js";
import ReferralReviewModal from "./ReferralReviewModal.jsx";

export default function ReferralsPage() {
  const { session } = useAuth();
  const diseases = ROLE_DISEASES[session.role];

  const [refs, setRefs] = useState([]);
  const [patients, setPatients] = useState({});
  const [reviewing, setReviewing] = useState(null);

  // Load referrals
  const refresh = async () => {
    try {
      const referrals = await api.listReferrals({
        role: session.role,
      });
      setRefs(referrals);
    } catch (err) {
      console.error("Failed to load referrals:", err);
    }
  };

  useEffect(() => {
    refresh();
  }, [session.role]);

  useEffect(() => {
    api.listPatients().then((ps) => {
      const map = {};
      ps.forEach((p) => {
        map[p.id] = p.name;
      });
      setPatients(map);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-2xl font-extrabold"
        style={{ color: C.text }}
      >
        Referrals — {diseases.join(" & ")}
      </h1>

      <Card className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left"
              style={{ color: C.textFaint }}
            >
              <th className="pb-2">Patient</th>
              <th className="pb-2">Disease</th>
              <th className="pb-2">Risk %</th>
              <th className="pb-2">Level</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {refs.map((r) => (
              <tr
                key={r.id}
                className="border-t"
                style={{ borderColor: C.border }}
              >
                <td
                  className="py-2.5 font-semibold"
                  style={{ color: C.text }}
                >
                  {patients[r.patient_id] || "—"}
                </td>

                <td
                  className="py-2.5 text-xs"
                  style={{ color: C.textMuted }}
                >
                  {r.disease}
                </td>

                <td
                  className="py-2.5 font-bold text-xs"
                  style={{ color: C.high }}
                >
                  {r.risk_percent}%
                </td>

                <td className="py-2.5">
                  <RiskBadge level={r.risk_level} />
                </td>

                <td className="py-2.5">
                  <StatusBadge status={r.status} />
                </td>

                <td className="py-2.5">
                  <button
                    onClick={() => setReviewing(r.id)}
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: C.primary }}
                  >
                    <Eye size={13} />
                    View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {refs.length === 0 && (
          <EmptyState text="No referrals yet" />
        )}
      </Card>

      {reviewing && (
        <ReferralReviewModal
          referralId={reviewing}
          onClose={() => setReviewing(null)}
          onSigned={() => {
            setReviewing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}