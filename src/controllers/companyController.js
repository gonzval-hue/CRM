const Company = require('../models/Company');
const convertBigInt = require('../utils/convertBigInt');

// Get all companies
async function getAll(req, res, next) {
  try {
    const { owner_id, search, limit, offset } = req.query;
    const filters = { owner_id, search, limit, offset };
    
    const companies = await Company.findAll(filters);
    res.json({ success: true, data: convertBigInt(companies) });
  } catch (error) {
    next(error);
  }
}

// Get company by ID
async function getById(req, res, next) {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    
    res.json({ success: true, data: convertBigInt(company) });
  } catch (error) {
    next(error);
  }
}

// Create new company
async function create(req, res, next) {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, data: convertBigInt(company) });
  } catch (error) {
    next(error);
  }
}

// Update company
async function update(req, res, next) {
  try {
    const company = await Company.update(req.params.id, req.body);
    
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    
    res.json({ success: true, data: convertBigInt(company) });
  } catch (error) {
    next(error);
  }
}

// Delete company
async function remove(req, res, next) {
  try {
    await Company.delete(req.params.id);
    res.json({ success: true, message: 'Company deleted successfully' });
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
};
