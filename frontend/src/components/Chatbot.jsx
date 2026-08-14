import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { C } from "../constants.js";
import * as api from "../lib/api.js";

export default function Chatbot({ open, setOpen, role }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I'm HealthHero. I can explain risk reports, disease markers, screening steps, or lifestyle guidance — ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  // Fetch first patient ID once on mount
  useEffect(() => {
    api.listPatients().then((patients) => {
      if (patients?.length > 0) setPatientId(patients[0].id);
    }).catch(() => {});
  }, []);

  const send = async (retryMessage) => {
    const msg = retryMessage || input.trim();
    if (!msg || loading) return;

    if (!retryMessage) {
      setMessages((cur) => [...cur, { role: "user", text: msg }]);
      setInput("");
    }
    setLoading(true);
    try {
      if (patientId) {
        const data = await api.chatWithGemini(patientId, msg);
        setMessages((cur) => [...cur, { role: "assistant", structured: data }]);
      } else {
        // Fallback to old assistant if no patient loaded
        const allMsgs = [...messages, { role: "user", text: msg }];
        const data = await api.chatWithAssistant(role, allMsgs);
        setMessages((cur) => [...cur, { role: "assistant", text: data.text }]);
      }
    } catch (e) {
      setMessages((cur) => [...cur, { role: "assistant", text: "I'm having trouble connecting right now.", error: true, retryMsg: msg }]);
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
                {m.text && <div>{m.text}</div>}
                {m.error && (
                  <button
                    onClick={() => send(m.retryMsg)}
                    className="mt-1 text-xs flex items-center gap-1 px-2 py-1 rounded"
                    style={{ color: C.primary }}
                  >
                    <RefreshCw size={11} /> Retry
                  </button>
                )}
                {m.structured && (
                  <div className="flex flex-col gap-2">
                    <div>{m.structured.answer}</div>
                    {m.structured.priority_conditions?.length > 0 && (
                      <div className="text-xs mt-1">
                        <strong>Priority: </strong>
                        {m.structured.priority_conditions.map((c) => c.toUpperCase()).join(", ")}
                      </div>
                    )}
                    {m.structured.recommendations?.length > 0 && (
                      <div className="mt-2 text-xs">
                        <strong>Recommendations:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          {m.structured.recommendations.map((rec, idx) => (
                            <li key={idx}><strong>{rec.category}:</strong> {rec.text}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {m.structured.disclaimer && (
                      <div className="text-[10px] text-gray-500 mt-2 italic border-t pt-1 border-gray-200">
                        {m.structured.disclaimer}
                      </div>
                    )}
                  </div>
                )}
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
            <button onClick={() => send()} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.primary }}>
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
