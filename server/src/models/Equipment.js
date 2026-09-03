const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  equipmentId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  location: { type: String },
  type: { type: String },
  status: { type: String, enum: ['operational', 'maintenance', 'offline', 'warning'], default: 'operational' },
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    technician: String
  }],
  safetyProcedure: {
    steps: [String],
    warnings: [String],
    requiredPPE: [String]
  },
  inspectionChecklist: {
    items: [{
      item: String,
      category: String,
      critical: Boolean
    }]
  },
  knownFaults: [{
    faultId: String,
    description: String,
    severity: String,
    reportedDate: Date
  }],
  technicianNotes: [{
    date: Date,
    technician: String,
    note: String
  }]
});

module.exports = mongoose.model('Equipment', EquipmentSchema);
