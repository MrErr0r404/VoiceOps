import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSessionStore } from '../store/sessionStore';

export function LatencyChart() {
  const history = useSessionStore(state => state.metrics.history);

  const data = history.map((m, i) => ({
    name: `Turn ${i + 1}`,
    STT: m.sttLatencyMs || 0,
    LLM: m.llmLatencyMs || 0,
    Rime: m.rimeFirstAudioMs || 0,
    Total: m.responseLatencyMs || 0
  }));

  if (data.length === 0) return <div className="text-gray-500 text-sm text-center p-4">No latency data yet</div>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #333' }} />
          <Legend />
          <Line type="monotone" dataKey="STT" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="LLM" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Rime" stroke="#a855f7" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
