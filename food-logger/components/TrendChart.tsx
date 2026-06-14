'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TrendChart({ data, target }: { data: { day: string; kcal: number }[]; target?: number }) {
  return (
    <div className="h-48 bg-neutral-900 rounded-2xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip contentStyle={{ background: '#171717', border: 'none' }} />
          {target && <ReferenceLine y={target} stroke="#10b981" strokeDasharray="3 3" />}
          <Line type="monotone" dataKey="kcal" stroke="#10b981" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
