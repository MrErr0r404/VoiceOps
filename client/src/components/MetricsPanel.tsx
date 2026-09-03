import React from 'react';
import { useSessionStore } from '../store/sessionStore';

export function MetricsPanel() {
  const metrics = useSessionStore(state => state.metrics);
  const latest = metrics.latest;

  const getLatencyColor = (val?: number) => {
    if (!val) return 'text-gray-500';
    if (val < 300) return 'text-voiceops-emerald';
    if (val < 500) return 'text-voiceops-amber';
    return 'text-voiceops-red';
  };

  return (
    <div className="p-4 glass-card space-y-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Realtime Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-xs text-gray-400">Interruption Latency</p>
          <p className={`text-2xl font-bold ${getLatencyColor(latest?.interruptionLatencyMs)}`}>
            {latest?.interruptionLatencyMs ? `${latest.interruptionLatencyMs}ms` : '--'}
          </p>
        </div>
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-xs text-gray-400">Response Latency</p>
          <p className={`text-2xl font-bold ${getLatencyColor(latest?.responseLatencyMs)}`}>
            {latest?.responseLatencyMs ? `${latest.responseLatencyMs}ms` : '--'}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Interruptions (Succ/Total)</span>
          <span className="text-gray-200">{metrics.aggregates.successfulInterruptions} / {metrics.aggregates.totalInterruptions}</span>
        </div>
        <div className="flex justify-between">
          <span>Stale Results Blocked</span>
          <span className="text-gray-200">{metrics.aggregates.staleResultsBlocked}</span>
        </div>
        <div className="flex justify-between">
          <span>Tools (Started/Cancelled)</span>
          <span className="text-gray-200">{metrics.aggregates.toolExecutionsStarted} / {metrics.aggregates.toolExecutionsCancelled}</span>
        </div>
      </div>
    </div>
  );
}
