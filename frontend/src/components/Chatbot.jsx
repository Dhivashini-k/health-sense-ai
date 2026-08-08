import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { C } from "../constants.js";
import * as api from "../lib/api.js";

export default function Chatbot({ open, setOpen, role }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I'm HealthHero. I can explain risk reports, disease markers, screening steps, or lifestyle guidance — ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user", text: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const data = await api.chatWithAssistant(role, next);
      setMessages((cur) => [...cur, { role: "assistant", text: data.text }]);
    } catch (e) {
      setMessages((cur) => [...cur, { role: "assistant", text: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{ backgroundColor: C.primary }}
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[460px] rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: C.primary }}>
            <Sparkles size={16} className="text-white" />
            <div className="text-white font-bold text-sm">HealthHero Assistant</div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "ml-auto" : ""}`}
                style={{ backgroundColor: m.role === "user" ? C.primaryLight : C.bg, color: C.text }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="px-3 py-2 text-xs flex items-center gap-1" style={{ color: C.textFaint }}>
                <Loader2 size={13} className="animate-spin" /> Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t flex gap-2" style={{ borderColor: C.border }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask HealthHero..."
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: C.border }}
            />
            <button onClick={send} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.primary }}>
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
