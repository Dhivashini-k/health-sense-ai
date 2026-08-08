import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal, RiskBadge, Button } from "../../components/ui.jsx";
import { C, LAB_TESTS_MAP, riskBg, riskColor, fmtDate } from "../../constants.js";
import * as api from "../../lib/api.js";

export default function ReferralReviewModal({ referralId, onClose, onSigned }) {
  const [detail, setDetail] = useState(null);
  const [labTests, setLabTests] = useState([]);

  useEffect(() => {
    api.viewReferral(referralId).finally(() => {
      api.getReferral(referralId).then((d) => {
        setDetail(d);
        setLabTests(d.lab_tests || []);
      });
    });
  }, [referralId]);

  if (!detail) return null;
  const { referral, patient, screening } = detail;
  const signed = referral.status === "Signed";
  const toggle = (t) => setLabTests((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const sign = async () => {
    await api.signReferral(referral.id, { lab_tests: labTests });
    onSigned && onSigned();
    onClose();
  };

  return (
    <Modal title={`Review — ${patient.name}`} onClose={onClose} wide>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Patient Details</div>
          <div className="text-sm space-y-1 mb-4" style={{ color: C.text }}>
            <div>{patient.name} · {patient.age}y · {patient.gender}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>{patient.phone} · {patient.address}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>History: {patient.medical_history || "—"}</div>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Risk Report</div>
          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: riskBg(referral.risk_level) }}>
            <div className="text-sm font-bold" style={{ color: C.text }}>{referral.disease}</div>
            <div className="text-2xl font-extrabold" style={{ color: riskColor(referral.risk_level) }}>{referral.risk_percent}%</div>
            <RiskBadge level={referral.risk_level} />
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Screening Data</div>
          <div className="text-xs space-y-1" style={{ color: C.textMuted }}>
            <div>BP: {screening.systolic}/{screening.diastolic} mmHg · BMI {screening.bmi} · HR {screening.heart_rate} bpm</div>
            <div>Lifestyle: {screening.smoking} smoking, {screening.activity} activity, {screening.diet} diet</div>
            <div>Symptoms: {(screening.symptoms || []).join(", ") || "None reported"}</div>
            <div>ECG: {screening.ecg_file || "Not uploaded"} · Retinal Scan: {screening.retinal_file || "Not uploaded"}</div>
            {screening.notes && <div className="italic">Nurse notes: "{screening.notes}"</div>}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Lab Test Selection</div>
          <div className="space-y-2 mb-5">
            {LAB_TESTS_MAP[referral.disease].map((t) => (
              <label key={t} className="flex items-center gap-2 p-2.5 rounded-lg border text-sm cursor-pointer" style={{ borderColor: C.border, opacity: signed ? 0.7 : 1 }}>
                <input type="checkbox" disabled={signed} checked={labTests.includes(t)} onChange={() => toggle(t)} /> {t}
              </label>
            ))}
          </div>
          {signed ? (
            <div className="p-3 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: C.lowBg, color: C.low }}>
              <CheckCircle2 size={16} /> Report signed
            </div>
          ) : (
            <Button className="w-full justify-center" onClick={sign}><CheckCircle2 size={16} /> Approve &amp; Sign Report</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
