import React from 'react';
import { EquipmentData } from '../types';
import { MapPin } from 'lucide-react';

export function EquipmentCard({ equipment }: { equipment: EquipmentData }) {
  const normStatus = (equipment.status || 'ACTIVE').toUpperCase();
  
  const statusColors: Record<string, string> = {
    ACTIVE: 'text-voiceops-emerald bg-voiceops-emerald/10 border-voiceops-emerald/30',
    OPERATIONAL: 'text-voiceops-emerald bg-voiceops-emerald/10 border-voiceops-emerald/30',
    MAINTENANCE: 'text-voiceops-amber bg-voiceops-amber/10 border-voiceops-amber/30',
    WARNING: 'text-voiceops-amber bg-voiceops-amber/10 border-voiceops-amber/30',
    OFFLINE: 'text-voiceops-red bg-voiceops-red/10 border-voiceops-red/30',
    UNKNOWN: 'text-gray-400 bg-gray-600/10 border-gray-500/30'
  };

  const badgeClass = statusColors[normStatus] || statusColors.UNKNOWN;
  const eqId = equipment.equipmentId || equipment.id || 'N/A';

  return (
    <div className="glass-card p-4 hover:bg-white/5 transition-colors cursor-pointer border border-white/5 rounded-xl">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-100">{equipment.name}</h4>
        <span className={`text-xs px-2 py-0.5 rounded border ${badgeClass}`}>
          {equipment.status}
        </span>
      </div>
      <div className="flex flex-col gap-1 mt-3">
        <span className="text-xs text-gray-500 font-mono">ID: {eqId}</span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin size={12} /> {equipment.location}
        </div>
      </div>
    </div>
  );
}
