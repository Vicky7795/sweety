import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

export default function GlucoseChart({ readings = [] }) {
  if (!readings || readings.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No readings available to plot chart.</p>
        <p className="text-xs text-slate-400 mt-1">Add readings to visualize your glucose trends.</p>
      </div>
    );
  }

  // Format data for line chart
  const chartData = readings.map((r, idx) => ({
    name: `${r.reading_date.slice(5)} (${r.time_slot.split(' ')[0]})`,
    date: r.reading_date,
    slot: r.time_slot,
    glucose: r.glucose_value,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
          <p className="font-bold text-slate-800">{data.date}</p>
          <p className="text-slate-500 font-medium">{data.slot}</p>
          <p className="text-brand-600 font-extrabold text-sm mt-1">
            {data.glucose} <span className="text-xs font-normal text-slate-400">mg/dl</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            domain={[40, 300]}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            unit=" mg"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={140} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Target Max (140)', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={70} stroke="#0ea5e9" strokeDasharray="3 3" label={{ value: 'Target Min (70)', fill: '#0ea5e9', fontSize: 10, position: 'right' }} />
          <Line
            type="monotone"
            dataKey="glucose"
            stroke="#7c3aed"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#6d28d9', stroke: '#ddd6fe', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
