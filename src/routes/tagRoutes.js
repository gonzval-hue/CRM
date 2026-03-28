const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

// GET /api/tags - List all tags
router.get('/', tagController.getAll);

// GET /api/tags/:id - Get tag by ID
router.get('/:id', tagController.getById);

// POST /api/tags - Create new tag
router.post('/', tagController.create);

// PUT /api/tags/:id - Update tag
router.put('/:id', tagController.update);

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', tagController.remove);

// GET /api/tags/:entityType/:entityId - Get tags by entity
router.get('/entity/:entityType/:entityId', tagController.getByEntity);

// POST /api/tags/:entityType/:entityId/add - Add tag to entity
router.post('/entity/:entityType/:entityId/add', tagController.addToEntity);

// DELETE /api/tags/:entityType/:entityId/:tagId - Remove tag from entity
router.delete('/entity/:entityType/:entityId/:tagId', tagController.removeFromEntity);

// POST /api/tags/:entityType/:entityId/sync - Sync tags for entity
router.post('/entity/:entityType/:entityId/sync', tagController.syncForEntity);

module.exports = router;
