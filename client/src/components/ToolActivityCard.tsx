import React from 'react';
import { ToolExecutionData } from '../types';
import { CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';

export function ToolActivityCard({ execution }: { execution: ToolExecutionData }) {
  const isCancelled = execution.status === 'CANCELLED';
  
  return (
    <div className={`p-4 rounded-xl border ${isCancelled ? 'bg-voiceops-red/5 border-voiceops-red/20' : 'glass-card'}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          {execution.toolName}
          {execution.status === 'RUNNING' && <Clock className="w-4 h-4 animate-spin text-voiceops-amber" />}
          {execution.status === 'COMPLETE' && <CheckCircle2 className="w-4 h-4 text-voiceops-emerald" />}
          {isCancelled && <XCircle className="w-4 h-4 text-voiceops-red" />}
          {execution.status === 'ERROR' && <ShieldAlert className="w-4 h-4 text-voiceops-red" />}
        </h4>
        <span className="text-xs text-gray-500">Gen {execution.generationId}</span>
      </div>
      <p className="text-xs text-gray-400 font-mono mb-2 truncate" title={execution.input}>{execution.input}</p>
      {isCancelled && <p className="text-xs text-voiceops-red">Execution blocked/cancelled due to stale generation.</p>}
    </div>
  );
}
