const EmailTemplate = require('../models/EmailTemplate');
const convertBigInt = require('../utils/convertBigInt');

// Get all templates
async function getAll(req, res, next) {
  try {
    const { category, is_active, owner_id } = req.query;
    const filters = { category, is_active, owner_id };
    const templates = await EmailTemplate.findAll(filters);
    res.json({ success: true, data: convertBigInt(templates) });
  } catch (error) {
    next(error);
  }
}

// Get template by ID
async function getById(req, res, next) {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: convertBigInt(template) });
  } catch (error) {
    next(error);
  }
}

// Create new template
async function create(req, res, next) {
  try {
    const template = await EmailTemplate.create(req.body);
    res.status(201).json({ success: true, data: convertBigInt(template) });
  } catch (error) {
    next(error);
  }
}

// Update template
async function update(req, res, next) {
  try {
    const template = await EmailTemplate.update(req.params.id, req.body);
    res.json({ success: true, data: convertBigInt(template) });
  } catch (error) {
    next(error);
  }
}

// Delete template
async function remove(req, res, next) {
  try {
    await EmailTemplate.delete(req.params.id);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Get templates by category
async function getByCategory(req, res, next) {
  try {
    const templates = await EmailTemplate.findByCategory(req.params.category);
    res.json({ success: true, data: convertBigInt(templates) });
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
  getByCategory,
};
