const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');

// GET /api/deals - List all deals
router.get('/', dealController.getAll);

// GET /api/deals/:id - Get deal by ID
router.get('/:id', dealController.getById);

// GET /api/deals/stage/:stage - Get deals by stage
router.get('/stage/:stage', dealController.getByStage);

// GET /api/deals/pipeline/summary - Get pipeline summary
router.get('/pipeline/summary', dealController.getPipelineSummary);

// POST /api/deals - Create new deal
router.post('/', dealController.create);

// PUT /api/deals/:id - Update deal
router.put('/:id', dealController.update);

// DELETE /api/deals/:id - Delete deal
router.delete('/:id', dealController.remove);

module.exports = router;
