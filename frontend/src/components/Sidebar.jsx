import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, ClipboardList, FileText, FlaskConical,
  ClipboardCheck, Stethoscope, HeartPulse,
} from "lucide-react";
import { C } from "../constants.js";

export default function Sidebar({ role }) {
  let items = [];
  if (role === "Nurse") {
    items = [
      ["/", "Dashboard", LayoutDashboard],
      ["/patients", "Patients", Users],
      ["/screening", "New Screening", ClipboardList],
      ["/archive", "Risk Report Archive", FileText],
      ["/labs", "Lab Tests", FlaskConical],
    ];
  } else if (role === "Super Admin") {
    items = [["/", "Global Analytics", LayoutDashboard]];
  } else {
    items = [
      ["/", "Dashboard", LayoutDashboard],
      ["/referrals", "Referrals", ClipboardCheck],
      ["/labs", "Lab Tests", FlaskConical],
    ];
  }
  return (
    <aside className="w-64 shrink-0 p-4 flex flex-col gap-1 min-h-screen" style={{ backgroundColor: C.primaryDeep }}>
      <div className="flex items-center gap-2 px-2 py-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.accent }}>
          <HeartPulse size={18} className="text-white" />
        </div>
        <div>
          <div className="text-white font-extrabold text-sm leading-none">HealthSense</div>
          <div className="text-white/50 text-[11px] mt-0.5">AI Screening Platform</div>
        </div>
      </div>
      {items.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive ? "bg-white/15 text-white" : "text-white/60 hover:text-white/90"}`
          }
        >
          <Icon size={17} /> {label}
        </NavLink>
      ))}
      <div className="mt-auto pt-4 px-3 text-[11px] text-white/30">v1.0 · Hospital Edition</div>
    </aside>
  );
}
