const ExportImport = require('../models/ExportImport');

// Export contacts to CSV
async function exportContacts(req, res, next) {
  try {
    const { owner_id, status, lead_source } = req.query;
    const csv = await ExportImport.exportContacts({ owner_id, status, lead_source });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

// Export companies to CSV
async function exportCompanies(req, res, next) {
  try {
    const { owner_id } = req.query;
    const csv = await ExportImport.exportCompanies({ owner_id });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=companies.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

// Export deals to CSV
async function exportDeals(req, res, next) {
  try {
    const { owner_id, stage } = req.query;
    const csv = await ExportImport.exportDeals({ owner_id, stage });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=deals.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

// Import contacts from CSV
async function importContacts(req, res, next) {
  try {
    const { owner_id } = req.body;
    const { csvData } = req.body;

    if (!owner_id) {
      return res.status(400).json({ success: false, error: 'owner_id is required' });
    }

    if (!csvData) {
      return res.status(400).json({ success: false, error: 'csvData is required' });
    }

    const result = await ExportImport.importContacts(csvData, owner_id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportContacts,
  exportCompanies,
  exportDeals,
  importContacts,
};
