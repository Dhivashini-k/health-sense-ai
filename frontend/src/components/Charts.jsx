import React, { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis,
  YAxis, CartesianGrid, Legend, BarChart, Bar,
} from "recharts";
import { Card, EmptyState } from "./ui.jsx";
import { C, DISEASE_COLOR } from "../constants.js";
import * as api from "../lib/api.js";

export function DiseaseDonut({ role, title = "Disease Risk Overview", subtitle = "Moderate + High risk referrals by disease" }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.getDiseaseOverview(role).then((counts) => {
      setData(Object.entries(counts).map(([name, value]) => ({ name, value })));
    });
  }, [role]);

  const total = (data || []).reduce((a, b) => a + b.value, 0);
  return (
    <Card className="p-5 flex-1 min-w-[300px]">
      <div className="font-bold text-sm mb-1" style={{ color: C.text }}>{title}</div>
      <div className="text-xs mb-2" style={{ color: C.textFaint }}>{subtitle}</div>
      {!data ? null : total === 0 ? <EmptyState text="No referrals yet" /> : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {data.map((d, i) => <Cell key={i} fill={DISEASE_COLOR[d.name]} />)}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export function RiskTrend({ diseases }) {
  const [disease, setDisease] = useState(diseases[0]);
  const [duration, setDuration] = useState("30 Days");
  const [data, setData] = useState(null);
  const durMap = { "7 Days": 7, "30 Days": 30, "3 Months": 90, "6 Months": 180, "1 Year": 365 };

  useEffect(() => {
    api.getRiskTrend(disease, durMap[duration]).then((rows) =>
      setData(rows.map((r) => ({ date: r.date.slice(5), avg: r.avg })))
    );
  }, [disease, duration]);

  return (
    <Card className="p-5 flex-[1.4] min-w-[340px]">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="font-bold text-sm" style={{ color: C.text }}>Risk Trend</div>
          <div className="text-xs" style={{ color: C.textFaint }}>Average predicted risk over time</div>
        </div>
        <div className="flex gap-2">
          <select value={disease} onChange={(e) => setDisease(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: C.border }}>
            {diseases.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: C.border }}>
            {Object.keys(durMap).map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      {!data ? null : data.length === 0 ? <EmptyState text="Not enough data in this range" /> : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="avg" stroke={DISEASE_COLOR[disease]} strokeWidth={2.5} dot={{ r: 3 }} name={`${disease} risk %`} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export function DiseaseDistribution({ diseases }) {
  const [duration, setDuration] = useState("Monthly");
  const [data, setData] = useState(null);
  const durMap = { Weekly: 7, Monthly: 30, Quarterly: 90, Yearly: 365 };

  useEffect(() => {
    api.getDistribution(durMap[duration]).then((result) => {
      setData(diseases.map((d) => ({ name: d, ...result[d] })));
    });
  }, [duration, diseases]);

  return (
    <Card className="p-5 flex-1 min-w-[340px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-bold text-sm" style={{ color: C.text }}>Disease-wise Risk Distribution</div>
          <div className="text-xs" style={{ color: C.textFaint }}>Patients per risk band</div>
        </div>
        <select value={duration} onChange={(e) => setDuration(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: C.border }}>
          {Object.keys(durMap).map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      {!data ? null : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Low" stackId="a" fill={C.low} />
            <Bar dataKey="Moderate" stackId="a" fill={C.moderate} />
            <Bar dataKey="High" stackId="a" fill={C.high} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
