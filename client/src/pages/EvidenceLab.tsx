import React from 'react';
import { StressTestPanel } from '../components/StressTestPanel';
import { LatencyChart } from '../components/LatencyChart';
import { ProviderBadge } from '../components/ProviderBadge';

export function EvidenceLab() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 overflow-y-auto h-full pb-20">
      <header>
        <h1 className="text-3xl font-bold mb-2 text-voiceops-blue">Evidence Lab</h1>
        <p className="text-gray-400">Proving VoiceOps' realtime interruption and safety capabilities.</p>
      </header>

      <section className="glass-card p-6 border-voiceops-blue/30">
        <h2 className="text-xl font-bold mb-4 text-voiceops-emerald">1. The Claim</h2>
        <p className="text-gray-300 leading-relaxed italic border-l-4 border-voiceops-emerald pl-4 bg-white/5 p-4 rounded-r-lg">
          "VoiceOps correctly handles user interruption during tool execution and audio playback. 
          When a user interrupts, audio stops instantly, stale tool executions are safely blocked or cancelled, 
          and new operations take precedence seamlessly without state corruption."
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">2. Acceptance Test</h2>
        <StressTestPanel />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">3. Latency Metrics</h2>
        <div className="glass-card p-6">
          <LatencyChart />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">4. System Configuration</h2>
        <div className="glass-card p-6 flex flex-wrap gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/5 flex-1 min-w-[200px]">
            <h3 className="text-sm font-bold text-gray-500 mb-2">Speech Synthesis</h3>
            <ProviderBadge provider="Rime Labs" status="active" />
            <p className="text-xs text-gray-400 mt-2 font-mono">Model: mist</p>
            <p className="text-xs text-gray-400 font-mono">Format: pcm_16000</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/5 flex-1 min-w-[200px]">
            <h3 className="text-sm font-bold text-gray-500 mb-2">Speech Recognition</h3>
            <ProviderBadge provider="Web Speech API" status="active" />
            <p className="text-xs text-gray-400 mt-2 font-mono">Mode: Continuous</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/5 flex-1 min-w-[200px]">
            <h3 className="text-sm font-bold text-gray-500 mb-2">Intelligence</h3>
            <ProviderBadge provider="OpenAI GPT-4" status="active" />
            <p className="text-xs text-gray-400 mt-2 font-mono">Streaming: True</p>
          </div>
        </div>
      </section>
    </div>
  );
}
