import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Field, Button, inputCls, inputStyle } from "../../components/ui.jsx";
import * as api from "../../lib/api.js";

export default function AddPatientForm({ onSaved }) {
  const [f, setF] = useState({ name: "", age: "", gender: "Male", phone: "", address: "", medical_history: "", previous_conditions: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setSaving(true);
    try {
      await api.createPatient({ ...f, age: +f.age });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Field label="Full Name"><input className={inputCls} style={inputStyle} value={f.name} onChange={set("name")} placeholder="Patient name" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Age"><input type="number" className={inputCls} style={inputStyle} value={f.age} onChange={set("age")} /></Field>
        <Field label="Gender">
          <select className={inputCls} style={inputStyle} value={f.gender} onChange={set("gender")}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
      </div>
      <Field label="Phone Number"><input className={inputCls} style={inputStyle} value={f.phone} onChange={set("phone")} placeholder="10-digit mobile" /></Field>
      <Field label="Address"><input className={inputCls} style={inputStyle} value={f.address} onChange={set("address")} /></Field>
      <Field label="Medical History"><textarea className={inputCls} style={inputStyle} value={f.medical_history} onChange={set("medical_history")} rows={2} /></Field>
      <Field label="Previous Conditions"><textarea className={inputCls} style={inputStyle} value={f.previous_conditions} onChange={set("previous_conditions")} rows={2} /></Field>
      <Button className="w-full justify-center mt-2" disabled={!f.name || !f.age || saving} onClick={submit}>
        <Plus size={16} /> {saving ? "Saving..." : "Register Patient"}
      </Button>
    </div>
  );
}
