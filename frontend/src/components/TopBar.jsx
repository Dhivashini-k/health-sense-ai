import React, { useState, useEffect } from "react";
import { Search, Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import * as api from "../lib/api.js";

export default function TopBar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (q.length > 1) {
      api.listPatients(q).then(setMatches);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [q]);

  useEffect(() => {
    api.listNotifications(session.role).then(setNotifs);
  }, [session.role]);

  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b" style={{ backgroundColor: C.card, borderColor: C.border }}>
      <div className="relative w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patients by name..."
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
          style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
        />
        {showResults && (
          <div className="absolute top-11 left-0 w-full bg-white rounded-xl border shadow-lg z-30 overflow-hidden" style={{ borderColor: C.border }}>
            {matches.length === 0 && <div className="p-3 text-xs" style={{ color: C.textFaint }}>No patients found</div>}
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => { navigate("/patients"); setShowResults(false); setQ(""); }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0"
                style={{ borderColor: C.border }}
              >
                <div className="font-semibold" style={{ color: C.text }}>{m.name}</div>
                <div className="text-xs" style={{ color: C.textFaint }}>{m.age}y · {m.gender} · {m.phone}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-xl hover:bg-gray-100">
            <Bell size={19} style={{ color: C.textMuted }} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: C.high }}>
                {unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl border shadow-lg z-30 overflow-hidden" style={{ borderColor: C.border }}>
              <div className="px-4 py-3 border-b font-bold text-sm" style={{ borderColor: C.border, color: C.text }}>Notifications</div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 && <div className="p-4 text-xs" style={{ color: C.textFaint }}>No notifications yet</div>}
                {notifs.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b last:border-0 text-xs" style={{ borderColor: C.border }}>
                    <div style={{ color: C.text }}>{n.message}</div>
                    <div className="mt-1" style={{ color: C.textFaint }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 pl-4 border-l" style={{ borderColor: C.border }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
            {session.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="text-sm">
            <div className="font-bold leading-none" style={{ color: C.text }}>{session.name}</div>
            <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{session.role}</div>
          </div>
          <button onClick={() => { logout(); navigate("/login"); }} className="p-2 rounded-xl hover:bg-gray-100 ml-1">
            <LogOut size={17} style={{ color: C.textMuted }} />
          </button>
        </div>
      </div>
    </header>
  );
}
