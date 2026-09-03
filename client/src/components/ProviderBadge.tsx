import React from 'react';

export function ProviderBadge({ provider, status }: { provider: string, status: 'active' | 'unavailable' | 'error' }) {
  const statusColors = {
    active: 'bg-voiceops-emerald',
    unavailable: 'bg-gray-500',
    error: 'bg-voiceops-red'
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-200">
      <span className={`w-2 h-2 rounded-full ${statusColors[status]}`}></span>
      {provider}
    </div>
  );
}
