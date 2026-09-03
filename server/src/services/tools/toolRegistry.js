const Equipment = require('../../models/Equipment');

const sleep = (ms, abortSignal) => new Promise((resolve, reject) => {
  if (abortSignal?.aborted) return reject(new Error('AbortError'));
  const timer = setTimeout(resolve, ms);
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('AbortError'));
    });
  }
});

const tools = {
  async getEquipment({ equipmentId }, { abortSignal, delayMs }) {
    await sleep(delayMs, abortSignal);
    if (abortSignal?.aborted) throw new Error('AbortError');
    return Equipment.findOne({ equipmentId }).lean();
  },
  async getMaintenanceHistory({ equipmentId }, { abortSignal, delayMs }) {
    await sleep(delayMs, abortSignal);
    if (abortSignal?.aborted) throw new Error('AbortError');
    const eq = await Equipment.findOne({ equipmentId }, 'maintenanceHistory').lean();
    return eq ? eq.maintenanceHistory : null;
  },
  async getSafetyProcedure({ equipmentId }, { abortSignal, delayMs }) {
    await sleep(delayMs, abortSignal);
    if (abortSignal?.aborted) throw new Error('AbortError');
    const eq = await Equipment.findOne({ equipmentId }, 'safetyProcedure').lean();
    return eq ? eq.safetyProcedure : null;
  },
  async getInspectionChecklist({ equipmentId }, { abortSignal, delayMs }) {
    await sleep(delayMs, abortSignal);
    if (abortSignal?.aborted) throw new Error('AbortError');
    const eq = await Equipment.findOne({ equipmentId }, 'inspectionChecklist').lean();
    return eq ? eq.inspectionChecklist : null;
  },
  async createMaintenanceNote({ equipmentId, note, technician }, { abortSignal, delayMs }) {
    await sleep(delayMs, abortSignal);
    if (abortSignal?.aborted) throw new Error('AbortError');
    const eq = await Equipment.findOne({ equipmentId });
    if (eq) {
      eq.technicianNotes.push({ date: new Date(), technician, note });
      await eq.save();
      return { success: true };
    }
    return { success: false, error: 'Equipment not found' };
  },
  async updateTaskStatus({ equipmentId, status }, { abortSignal, delayMs }) {
    await sleep(delayMs, abortSignal);
    if (abortSignal?.aborted) throw new Error('AbortError');
    const eq = await Equipment.findOne({ equipmentId });
    if (eq) {
      eq.status = status;
      await eq.save();
      return { success: true };
    }
    return { success: false, error: 'Equipment not found' };
  },
  async searchKnowledgeBase({ query }, { abortSignal, delayMs }) {
    await sleep(delayMs, abortSignal);
    if (abortSignal?.aborted) throw new Error('AbortError');
    return Equipment.find({ $or: [{ name: new RegExp(query, 'i') }, { type: new RegExp(query, 'i') }] }).lean();
  }
};

module.exports = tools;
