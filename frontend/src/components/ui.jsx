import React from "react";
import { X } from "lucide-react";
import { C, riskColor, riskBg } from "../constants.js";

export function Badge({ children, color, bg }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: color || C.primary, backgroundColor: bg || C.primaryLight }}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level }) {
  return <Badge color={riskColor(level)} bg={riskBg(level)}>{level}</Badge>;
}

export function StatusBadge({ status }) {
  const map = {
    Draft: [C.moderate, C.moderateBg],
    Viewed: ["#2563EB", "#E7EEFD"],
    Signed: [C.low, C.lowBg],
    Archived: [C.textMuted, "#EEF2F1"],
  };
  const [color, bg] = map[status] || [C.textMuted, "#EEF2F1"];
  return <Badge color={color} bg={bg}>{status}</Badge>;
}

export function Card({ children, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border ${className} ${onClick ? "cursor-pointer transition-transform hover:-translate-y-0.5" : ""}`}
      style={{ backgroundColor: C.card, borderColor: C.border, boxShadow: "0 1px 2px rgba(15,40,30,0.04)", ...style }}
    >
      {children}
    </div>
  );
}

export function KPICard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <Card className="p-5 flex-1 min-w-[210px]" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>{label}</div>
          <div className="text-3xl font-extrabold mt-2" style={{ color: C.text }}>{value}</div>
          {sub && <div className="text-xs mt-1" style={{ color: C.textMuted }}>{sub}</div>}
        </div>
        <div className="rounded-xl p-2.5" style={{ backgroundColor: (color || C.primary) + "1A" }}>
          <Icon size={20} style={{ color: color || C.primary }} />
        </div>
      </div>
    </Card>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: { backgroundColor: C.primary, color: "#fff" },
    outline: { backgroundColor: "transparent", color: C.primary, border: `1px solid ${C.primary}` },
    ghost: { backgroundColor: C.primaryLighter, color: C.primaryDark },
    danger: { backgroundColor: C.high, color: "#fff" },
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(10,25,20,0.45)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto rounded-2xl`}
        style={{ backgroundColor: C.card }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ borderColor: C.border, backgroundColor: C.card }}>
          <h3 className="font-bold text-lg" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: C.textMuted }} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="text-center py-10 text-sm" style={{ color: C.textFaint }}>{text}</div>;
}

export function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <div className="text-xs font-semibold mb-1.5" style={{ color: C.textMuted }}>{label}</div>
      {children}
    </label>
  );
}

export const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2";
export const inputStyle = { borderColor: C.border };
