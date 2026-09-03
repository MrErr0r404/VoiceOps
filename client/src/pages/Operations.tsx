import React from 'react';
import { EquipmentCard } from '../components/EquipmentCard';
import { EquipmentData } from '../types';
import { Search } from 'lucide-react';

const DUMMY_EQUIPMENT: EquipmentData[] = [
  { id: 'EQ-001', name: 'Conveyor Belt 4', location: 'Zone A', status: 'ACTIVE' },
  { id: 'EQ-002', name: 'Conveyor Belt 7', location: 'Zone B', status: 'MAINTENANCE' },
  { id: 'EQ-003', name: 'Hydraulic Press Alpha', location: 'Zone C', status: 'OFFLINE' },
  { id: 'EQ-004', name: 'Cooling Tower 2', location: 'Roof', status: 'ACTIVE' },
];

export function Operations() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Equipment Operations</h1>
          <p className="text-gray-400">Manage and monitor facility assets.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search equipment..." 
            className="bg-voiceops-card border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-voiceops-emerald transition-colors w-64 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {DUMMY_EQUIPMENT.map(eq => (
          <EquipmentCard key={eq.id} equipment={eq} />
        ))}
      </div>
    </div>
  );
}
