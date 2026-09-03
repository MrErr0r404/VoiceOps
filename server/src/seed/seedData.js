const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const config = require('../config');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    await Equipment.deleteMany({});
    console.log('Cleared existing equipment');

    const equipment = [
      {
        equipmentId: 'CB-001',
        name: 'Conveyor Belt 1',
        location: 'Zone A',
        type: 'Conveyor',
        status: 'operational',
        maintenanceHistory: [
          { date: new Date('2023-01-15'), type: 'preventative', description: 'Replaced rollers', technician: 'Alice' },
          { date: new Date('2023-06-20'), type: 'repair', description: 'Fixed torn belt', technician: 'Bob' }
        ],
        safetyProcedure: {
          steps: ['Isolate power source', 'Apply LOTO', 'Wait for complete stop'],
          warnings: ['Pinch points exist', 'Heavy loads'],
          requiredPPE: ['Hard hat', 'Safety glasses', 'Steel-toe boots']
        },
        inspectionChecklist: {
          items: [
            { item: 'Check belt tension', category: 'Mechanical', critical: true },
            { item: 'Inspect rollers for wear', category: 'Mechanical', critical: false }
          ]
        },
        knownFaults: [],
        technicianNotes: []
      },
      {
        equipmentId: 'CB-004',
        name: 'Conveyor Belt 4',
        location: 'Zone B',
        type: 'Conveyor',
        status: 'warning',
        maintenanceHistory: [
          { date: new Date('2023-08-10'), type: 'inspection', description: 'Noticed slight vibration', technician: 'Charlie' }
        ],
        safetyProcedure: {
          steps: ['Lock out tag out', 'Verify zero energy', 'Secure area'],
          warnings: ['High voltage', 'Moving parts'],
          requiredPPE: ['Gloves', 'Safety glasses']
        },
        inspectionChecklist: {
          items: [
            { item: 'Check motor vibration', category: 'Electrical', critical: true },
            { item: 'Inspect drive chain', category: 'Mechanical', critical: true }
          ]
        },
        knownFaults: [
          { faultId: 'F-101', description: 'Motor running hot', severity: 'medium', reportedDate: new Date() }
        ],
        technicianNotes: []
      },
      {
        equipmentId: 'CB-007',
        name: 'Conveyor Belt 7',
        location: 'Zone C',
        type: 'Conveyor',
        status: 'operational',
        maintenanceHistory: [],
        safetyProcedure: {
          steps: ['Confirm LOTO is complete', 'Verify E-stop accessible', 'Check guard panels secure'],
          warnings: ['Sharp edges'],
          requiredPPE: ['Hard hat', 'Safety glasses', 'Cut-resistant gloves']
        },
        inspectionChecklist: {
          items: [
            { item: 'Check belt alignment', category: 'Mechanical', critical: true }
          ]
        },
        knownFaults: [],
        technicianNotes: []
      },
      {
        equipmentId: 'PMP-003',
        name: 'Cooling Pump 3',
        location: 'Mechanical Room',
        type: 'Pump',
        status: 'operational',
        maintenanceHistory: [
          { date: new Date('2022-11-05'), type: 'preventative', description: 'Annual overhaul', technician: 'Dave' }
        ],
        safetyProcedure: {
          steps: ['Shut off intake valve', 'Drain system', 'LOTO pump motor'],
          warnings: ['Pressurized system', 'Hot surfaces'],
          requiredPPE: ['Face shield', 'Thermal gloves']
        },
        inspectionChecklist: {
          items: [
            { item: 'Check seal for leaks', category: 'Mechanical', critical: true },
            { item: 'Measure flow rate', category: 'Performance', critical: false }
          ]
        },
        knownFaults: [],
        technicianNotes: []
      },
      {
        equipmentId: 'HVAC-012',
        name: 'Air Handler 12',
        location: 'Roof',
        type: 'HVAC',
        status: 'maintenance',
        maintenanceHistory: [
          { date: new Date('2023-09-01'), type: 'repair', description: 'Replacing fan motor', technician: 'Eve' }
        ],
        safetyProcedure: {
          steps: ['Disconnect main breaker', 'Secure fan blade', 'Use fall protection'],
          warnings: ['Fall hazard', 'Electrical shock'],
          requiredPPE: ['Harness', 'Insulated gloves']
        },
        inspectionChecklist: {
          items: [
            { item: 'Inspect filter', category: 'Maintenance', critical: false },
            { item: 'Check refrigerant pressure', category: 'Mechanical', critical: true }
          ]
        },
        knownFaults: [],
        technicianNotes: []
      }
    ];

    await Equipment.insertMany(equipment);
    console.log('Seeded 5 equipment items');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
