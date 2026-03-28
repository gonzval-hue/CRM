const Deal = require('../models/Deal');
const convertBigInt = require('../utils/convertBigInt');

// Get all deals
async function getAll(req, res, next) {
  try {
    const { owner_id, stage, company_id, contact_id, search, limit, offset } = req.query;
    const filters = { owner_id, stage, company_id, contact_id, search, limit, offset };
    
    const deals = await Deal.findAll(filters);
    res.json({ success: true, data: convertBigInt(deals) });
  } catch (error) {
    next(error);
  }
}

// Get deal by ID
async function getById(req, res, next) {
  try {
    const deal = await Deal.findById(req.params.id);
    
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    res.json({ success: true, data: convertBigInt(deal) });
  } catch (error) {
    next(error);
  }
}

// Create new deal
async function create(req, res, next) {
  try {
    const deal = await Deal.create(req.body);
    res.status(201).json({ success: true, data: convertBigInt(deal) });
  } catch (error) {
    next(error);
  }
}

// Update deal
async function update(req, res, next) {
  try {
    const deal = await Deal.update(req.params.id, req.body);
    
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    res.json({ success: true, data: convertBigInt(deal) });
  } catch (error) {
    next(error);
  }
}

// Delete deal
async function remove(req, res, next) {
  try {
    await Deal.delete(req.params.id);
    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Get deals by stage
async function getByStage(req, res, next) {
  try {
    const deals = await Deal.findByStage(req.params.stage);
    res.json({ success: true, data: convertBigInt(deals) });
  } catch (error) {
    next(error);
  }
}

// Get pipeline summary
async function getPipelineSummary(req, res, next) {
  try {
    const summary = await Deal.getPipelineSummary();
    res.json({ success: true, data: convertBigInt(summary) });
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
  getByStage,
  getPipelineSummary,
};
