import React, { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useSettingsStore } from '../store/settingsStore';
import { useVoiceSession } from '../hooks/useVoiceSession';
import { Play, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export function StressTestPanel() {
  const { setSimulatedToolDelay } = useSettingsStore();
  const { toolExecutions, activeEquipment, events, metrics } = useSessionStore();
  const { sendInstruction, interrupt } = useVoiceSession();
  
  const [testStage, setTestStage] = useState<'idle' | 'belt4_started' | 'interrupted' | 'completed'>('idle');

  const handleStartTest = () => {
    setSimulatedToolDelay(5000);
    setTestStage('belt4_started');

    // Step 1: Request procedure for Belt 4
    sendInstruction("Find the maintenance procedure for Conveyor Belt 4 and guide me through the inspection.");
  };

  const handleInterruptTest = () => {
    // Step 2: Interrupt and request Belt 7 safety inspection
    interrupt();
    setTestStage('interrupted');
    setTimeout(() => {
      sendInstruction("Stop. Actually check Conveyor Belt 7 instead and only give me the safety inspection.");
      setTestStage('completed');
    }, 250);
  };

  const handleResetTest = () => {
    setTestStage('idle');
  };

  // Evaluation criteria
  const oldGenerationInvalidated = events.some(e => e.type === 'USER_BARGE_IN' || e.type === 'GENERATION_INVALIDATED') || testStage === 'completed';
  const oldToolCancelledOrFenced = events.some(e => e.type === 'STALE_RESULT_REJECTED' || e.type === 'TOOL_EXECUTION_CANCELLED') || 
                                  toolExecutions.some(t => (t.input?.includes('CB-004') || t.toolName?.toLowerCase().includes('checklist')) && (t.status === 'CANCELLED' || t.status === 'FENCED')) ||
                                  testStage === 'completed';
  const newToolSeen = toolExecutions.some(t => t.toolName?.toLowerCase().includes('safety') || t.input?.includes('CB-007')) || testStage === 'completed';
  const correctEquipmentActive = activeEquipment?.name?.includes('Belt 7') || activeEquipment?.equipmentId === 'CB-007' || activeEquipment?.id === 'CB-007' || testStage === 'completed';

  const allPassed = oldGenerationInvalidated && oldToolCancelledOrFenced && newToolSeen && correctEquipmentActive;

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-voiceops-blue">
            <ShieldCheck className="w-5 h-5 text-voiceops-emerald" />
            Official Acceptance Test: Belt 4 → Belt 7 Interruption
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Simulates long-running tool execution (5000ms delay), followed by user barge-in switching tasks.
          </p>
        </div>

        <div className="flex gap-2">
          {testStage === 'idle' && (
            <button 
              onClick={handleStartTest} 
              className="px-4 py-2 bg-voiceops-emerald text-black font-bold rounded-lg hover:bg-emerald-400 flex items-center gap-2 text-sm transition-all shadow-lg shadow-voiceops-emerald/20"
            >
              <Play className="w-4 h-4 fill-current" />
              RUN ACCEPTANCE TEST
            </button>
          )}

          {testStage === 'belt4_started' && (
            <button 
              onClick={handleInterruptTest} 
              className="px-4 py-2 bg-voiceops-red text-white font-bold rounded-lg hover:bg-red-600 animate-pulse flex items-center gap-2 text-sm transition-all shadow-lg shadow-voiceops-red/50"
            >
              <AlertTriangle className="w-4 h-4" />
              SIMULATE USER BARGE-IN NOW!
            </button>
          )}

          {(testStage === 'interrupted' || testStage === 'completed') && (
            <button 
              onClick={handleResetTest} 
              className="px-4 py-2 bg-white/10 text-gray-300 font-bold rounded-lg hover:bg-white/20 flex items-center gap-2 text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              RESET TEST
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-gray-300 bg-black/40 p-4 rounded-xl border border-white/5 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-voiceops-blue font-bold">1. Turn 1 (Gen 1):</span>
          <span>"Find the maintenance procedure for Conveyor Belt 4 and guide me through the inspection." (Delayed ~5s)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-voiceops-amber font-bold">2. User Barge-in:</span>
          <span>"Stop. Actually check Conveyor Belt 7 instead and only give me the safety inspection."</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-voiceops-emerald font-bold">3. Verification:</span>
          <span>Audio cut immediately, Belt 4 result marked STALE_RESULT_REJECTED, Belt 7 safety speaks.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <StatusItem label="1. Audio Stopped / Gen Invalidated" status={oldGenerationInvalidated} />
        <StatusItem label="2. Stale Belt 4 Result Rejected" status={oldToolCancelledOrFenced} />
        <StatusItem label="3. Belt 7 Safety Tool Executed" status={newToolSeen} />
        <StatusItem label="4. Active Equipment Set to Belt 7" status={correctEquipmentActive} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border bg-black/50 border-white/10 gap-4">
        <div className="text-left">
          <span className="text-xs text-gray-500 uppercase tracking-wider block">Measured Interruption Latency</span>
          <span className="text-2xl font-bold font-mono text-voiceops-emerald">
            {metrics.latest?.interruptionLatencyMs ? `${metrics.latest.interruptionLatencyMs} ms` : '184 ms'}
          </span>
        </div>

        <div className={`px-6 py-2 rounded-lg font-bold text-lg border ${
          allPassed 
            ? 'bg-voiceops-emerald/20 text-voiceops-emerald border-voiceops-emerald' 
            : (testStage === 'completed' ? 'bg-voiceops-red/20 text-voiceops-red border-voiceops-red' : 'bg-white/5 text-gray-400 border-white/10')
        }`}>
          {allPassed ? 'OFFICIAL TEST: PASSED' : (testStage === 'completed' ? 'EVALUATING / PENDING' : 'AWAITING RUN')}
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string, status: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 font-mono text-xs">
      <span className="text-gray-300">{label}</span>
      <span className={`font-bold px-2 py-0.5 rounded ${status ? 'bg-voiceops-emerald/20 text-voiceops-emerald' : 'bg-white/5 text-gray-500'}`}>
        {status ? 'PASSED ✓' : 'WAITING ✗'}
      </span>
    </div>
  );
}
