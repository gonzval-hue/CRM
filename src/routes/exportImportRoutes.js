const express = require('express');
const router = express.Router();
const exportImportController = require('../controllers/exportImportController');

// GET /api/export/contacts - Export contacts to CSV
router.get('/contacts', exportImportController.exportContacts);

// GET /api/export/companies - Export companies to CSV
router.get('/companies', exportImportController.exportCompanies);

// GET /api/export/deals - Export deals to CSV
router.get('/deals', exportImportController.exportDeals);

// POST /api/import/contacts - Import contacts from CSV
router.post('/contacts', exportImportController.importContacts);

module.exports = router;
