const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// GET /api/notes - List all notes
router.get('/', noteController.getAll);

// GET /api/notes/:id - Get note by ID
router.get('/:id', noteController.getById);

// POST /api/notes - Create new note
router.post('/', noteController.create);

// PUT /api/notes/:id - Update note
router.put('/:id', noteController.update);

// DELETE /api/notes/:id - Delete note
router.delete('/:id', noteController.remove);

// GET /api/notes/:entityType/:entityId - Get notes by entity
router.get('/entity/:entityType/:entityId', noteController.getByEntity);

// POST /api/notes/:id/toggle-pin - Toggle pin status
router.post('/:id/toggle-pin', noteController.togglePin);

module.exports = router;
