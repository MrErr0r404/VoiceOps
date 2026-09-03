import React from 'react';
import { useSessionStore } from '../store/sessionStore';
import { ToolActivityCard } from './ToolActivityCard';
import { EquipmentCard } from './EquipmentCard';
import { ProviderBadge } from './ProviderBadge';

export function OperationalContext() {
  const { activeEquipment, currentTask, toolExecutions, rimeConfig, sessionId, currentGenerationId, sessionState } = useSessionStore();

  return (
    <div className="p-4 space-y-6 bg-voiceops-card rounded-xl border border-white/5 h-full overflow-y-auto">
      <div>
        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Session Info</h3>
        <div className="text-xs text-gray-300 space-y-1">
          <p>ID: {sessionId || 'Not Started'}</p>
          <p>Generation: {currentGenerationId}</p>
          <p>State: {sessionState}</p>
        </div>
      </div>
      
      {activeEquipment && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Active Equipment</h3>
          <EquipmentCard equipment={activeEquipment} />
        </div>
      )}
      
      {currentTask && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Current Task</h3>
          <div className="p-3 bg-voiceops-blue/10 border border-voiceops-blue/20 rounded-lg text-sm text-voiceops-blue">
            {currentTask}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Providers</h3>
        <div className="flex flex-wrap gap-2">
          <ProviderBadge provider="Rime (Speech)" status={rimeConfig ? 'active' : 'unavailable'} />
          <ProviderBadge provider="Web Speech (STT)" status="active" />
          <ProviderBadge provider="OpenAI (LLM)" status="active" />
        </div>
      </div>

      {toolExecutions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Tool Activity</h3>
          <div className="space-y-3">
            {toolExecutions.slice(-3).reverse().map(ex => (
              <ToolActivityCard key={ex.id} execution={ex} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
