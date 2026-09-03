import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function Settings() {
  const settings = useSettingsStore();

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <section className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Voice Configuration</h2>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Selected Voice</label>
          <select 
            value={settings.selectedVoice}
            onChange={(e) => settings.setSelectedVoice(e.target.value)}
            className="w-full max-w-xs bg-black/50 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-voiceops-emerald"
          >
            <option value="cove">Cove (Professional, clear)</option>
            <option value="mist">Mist (Direct, operations)</option>
            <option value="amber">Amber (Warm, guiding)</option>
          </select>
        </div>
      </section>

      <section className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Testing & Simulation</h2>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Simulated Tool Delay: {settings.simulatedToolDelayMs}ms
          </label>
          <input 
            type="range" 
            min="0" max="10000" step="500"
            value={settings.simulatedToolDelayMs}
            onChange={(e) => settings.setSimulatedToolDelay(Number(e.target.value))}
            className="w-full max-w-md accent-voiceops-amber"
          />
          <p className="text-xs text-gray-500 mt-1">Simulates network/hardware delay for tool execution to test interruption handling.</p>
        </div>
        
        <label className="flex items-center gap-3 cursor-pointer mt-4">
          <input 
            type="checkbox" 
            checked={settings.demoMode}
            onChange={(e) => settings.setDemoMode(e.target.checked)}
            className="w-4 h-4 accent-voiceops-emerald"
          />
          <span className="text-sm">Demo Mode (Fakes hardware API calls)</span>
        </label>
      </section>

      <section className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Developer Tools</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={settings.showEventTimeline}
            onChange={(e) => settings.setShowEventTimeline(e.target.checked)}
            className="w-4 h-4 accent-voiceops-emerald"
          />
          <span className="text-sm">Show Event Timeline</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer mt-2">
          <input 
            type="checkbox" 
            checked={settings.showMetrics}
            onChange={(e) => settings.setShowMetrics(e.target.checked)}
            className="w-4 h-4 accent-voiceops-emerald"
          />
          <span className="text-sm">Show Realtime Metrics</span>
        </label>
      </section>
    </div>
  );
}
