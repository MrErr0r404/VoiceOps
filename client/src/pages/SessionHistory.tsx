import React from 'react';
import { Clock, MessageSquare, Play } from 'lucide-react';

export function SessionHistory() {
  const sessions = [
    { id: 'sess_1', date: '2023-10-27T10:30:00', duration: '14m 23s', turns: 12 },
    { id: 'sess_2', date: '2023-10-26T15:45:00', duration: '5m 10s', turns: 4 },
    { id: 'sess_3', date: '2023-10-25T09:15:00', duration: '45m 01s', turns: 38 },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-2">Session History</h1>
      <p className="text-gray-400">Review past operational conversations.</p>

      <div className="space-y-4 mt-8">
        {sessions.map(s => (
          <div key={s.id} className="glass-card p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-gray-200">Session {s.id}</h3>
              <div className="flex gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(s.date).toLocaleString()}</span>
                <span className="flex items-center gap-1"><Play size={14} /> {s.duration}</span>
                <span className="flex items-center gap-1"><MessageSquare size={14} /> {s.turns} turns</span>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-white/5 text-voiceops-emerald opacity-0 group-hover:opacity-100 transition-opacity">
              View Transcript
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
