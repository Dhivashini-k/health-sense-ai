import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import Chatbot from "./Chatbot.jsx";
import { C } from "../constants.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { session } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="w-full min-h-screen flex" style={{ backgroundColor: C.bg }}>
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Chatbot open={chatOpen} setOpen={setChatOpen} role={session.role} />
    </div>
  );
}
