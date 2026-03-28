const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', dashboardController.getMetrics);

// GET /api/dashboard/contacts/status - Get contacts by status distribution
router.get('/contacts/status', dashboardController.getContactsByStatus);

// GET /api/dashboard/deals/summary - Get deals won/lost summary
router.get('/deals/summary', dashboardController.getDealsSummary);

module.exports = router;
