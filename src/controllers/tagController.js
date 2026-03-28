const Tag = require('../models/Tag');
const convertBigInt = require('../utils/convertBigInt');

// Get all tags
async function getAll(req, res, next) {
  try {
    const tags = await Tag.findAll();
    res.json({ success: true, data: convertBigInt(tags) });
  } catch (error) {
    next(error);
  }
}

// Get tag by ID
async function getById(req, res, next) {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, error: 'Tag not found' });
    }
    res.json({ success: true, data: convertBigInt(tag) });
  } catch (error) {
    next(error);
  }
}

// Create new tag
async function create(req, res, next) {
  try {
    const tag = await Tag.create(req.body);
    res.status(201).json({ success: true, data: convertBigInt(tag) });
  } catch (error) {
    next(error);
  }
}

// Update tag
async function update(req, res, next) {
  try {
    const tag = await Tag.update(req.params.id, req.body);
    res.json({ success: true, data: convertBigInt(tag) });
  } catch (error) {
    next(error);
  }
}

// Delete tag
async function remove(req, res, next) {
  try {
    await Tag.delete(req.params.id);
    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Get tags by entity
async function getByEntity(req, res, next) {
  try {
    const { entityType, entityId } = req.params;
    const tags = await Tag.findByEntity(entityType, entityId);
    res.json({ success: true, data: convertBigInt(tags) });
  } catch (error) {
    next(error);
  }
}

// Add tag to entity
async function addToEntity(req, res, next) {
  try {
    const { entityType, entityId } = req.params;
    const { tagId } = req.body;
    await Tag.addToEntity(entityType, entityId, tagId);
    res.json({ success: true, message: 'Tag added successfully' });
  } catch (error) {
    next(error);
  }
}

// Remove tag from entity
async function removeFromEntity(req, res, next) {
  try {
    const { entityType, entityId, tagId } = req.params;
    await Tag.removeFromEntity(entityType, entityId, tagId);
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (error) {
    next(error);
  }
}

// Sync tags for entity
async function syncForEntity(req, res, next) {
  try {
    const { entityType, entityId } = req.params;
    const { tagIds } = req.body;
    await Tag.syncForEntity(entityType, entityId, tagIds);
    res.json({ success: true, message: 'Tags synced successfully' });
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
  addToEntity,
  removeFromEntity,
  syncForEntity,
};
