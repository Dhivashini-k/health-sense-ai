import React, { useState, useEffect } from "react";
import { UserPlus, Search } from "lucide-react";
import { Card, Modal, EmptyState, Button } from "../../components/ui.jsx";
import { C, fmtDate } from "../../constants.js";
import * as api from "../../lib/api.js";
import AddPatientForm from "./AddPatientForm.jsx";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);

  const refresh = (query) => api.listPatients(query).then(setPatients);
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const t = setTimeout(() => refresh(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>Patients</h1>
        <Button onClick={() => setModal(true)}><UserPlus size={16} /> Add New Patient</Button>
      </div>
      <Card className="p-5">
        <div className="relative mb-4 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textFaint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients by name..." className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.border }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.textFaint }}>
                <th className="pb-2">Name</th><th className="pb-2">Age</th><th className="pb-2">Gender</th>
                <th className="pb-2">Phone</th><th className="pb-2">Address</th><th className="pb-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-2.5 font-semibold" style={{ color: C.text }}>{p.name}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{p.age}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{p.gender}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{p.phone}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textMuted }}>{p.address}</td>
                  <td className="py-2.5 text-xs" style={{ color: C.textFaint }}>{fmtDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && <EmptyState text="No patients found" />}
        </div>
      </Card>
      {modal && (
        <Modal title="Register New Patient" onClose={() => setModal(false)}>
          <AddPatientForm onSaved={() => { setModal(false); refresh(q); }} />
        </Modal>
      )}
    </div>
  );
}
