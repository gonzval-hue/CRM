const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// GET /api/activities - List all activities
router.get('/', activityController.getAll);

// GET /api/activities/:id - Get activity by ID
router.get('/:id', activityController.getById);

// GET /api/activities/upcoming - Get upcoming activities
router.get('/upcoming', activityController.getUpcoming);

// POST /api/activities - Create new activity
router.post('/', activityController.create);

// PUT /api/activities/:id - Update activity
router.put('/:id', activityController.update);

// POST /api/activities/:id/complete - Mark activity as completed
router.post('/:id/complete', activityController.complete);

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', activityController.remove);

module.exports = router;
