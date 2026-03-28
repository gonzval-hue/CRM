const Note = require('../models/Note');
const convertBigInt = require('../utils/convertBigInt');

// Get all notes
async function getAll(req, res, next) {
  try {
    const { entity_type, entity_id, owner_id, limit, offset } = req.query;
    const filters = { entity_type, entity_id, owner_id, limit, offset };
    const notes = await Note.findAll(filters);
    res.json({ success: true, data: convertBigInt(notes) });
  } catch (error) {
    next(error);
  }
}

// Get note by ID
async function getById(req, res, next) {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.json({ success: true, data: convertBigInt(note) });
  } catch (error) {
    next(error);
  }
}

// Create new note
async function create(req, res, next) {
  try {
    const note = await Note.create(req.body);
    res.status(201).json({ success: true, data: convertBigInt(note) });
  } catch (error) {
    next(error);
  }
}

// Update note
async function update(req, res, next) {
  try {
    const note = await Note.update(req.params.id, req.body);
    res.json({ success: true, data: convertBigInt(note) });
  } catch (error) {
    next(error);
  }
}

// Delete note
async function remove(req, res, next) {
  try {
    await Note.delete(req.params.id);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Get notes by entity
async function getByEntity(req, res, next) {
  try {
    const { entityType, entityId } = req.params;
    const notes = await Note.findByEntity(entityType, entityId);
    res.json({ success: true, data: convertBigInt(notes) });
  } catch (error) {
    next(error);
  }
}

// Toggle pin status
async function togglePin(req, res, next) {
  try {
    const note = await Note.togglePin(req.params.id);
    res.json({ success: true, data: convertBigInt(note) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getByEntity,
  togglePin,
};
