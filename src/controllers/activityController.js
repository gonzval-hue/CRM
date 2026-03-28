const Activity = require('../models/Activity');
const convertBigInt = require('../utils/convertBigInt');

// Get all activities
async function getAll(req, res, next) {
  try {
    const { owner_id, type, status, contact_id, company_id, deal_id, limit, offset } = req.query;
    const filters = { owner_id, type, status, contact_id, company_id, deal_id, limit, offset };
    
    const activities = await Activity.findAll(filters);
    res.json({ success: true, data: convertBigInt(activities) });
  } catch (error) {
    next(error);
  }
}

// Get activity by ID
async function getById(req, res, next) {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    res.json({ success: true, data: convertBigInt(activity) });
  } catch (error) {
    next(error);
  }
}

// Create new activity
async function create(req, res, next) {
  try {
    const activity = await Activity.create(req.body);
    res.status(201).json({ success: true, data: convertBigInt(activity) });
  } catch (error) {
    next(error);
  }
}

// Update activity
async function update(req, res, next) {
  try {
    const activity = await Activity.update(req.params.id, req.body);
    
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    
    res.json({ success: true, data: convertBigInt(activity) });
  } catch (error) {
    next(error);
  }
}

// Delete activity
async function remove(req, res, next) {
  try {
    await Activity.delete(req.params.id);
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Mark activity as completed
async function complete(req, res, next) {
  try {
    const activity = await Activity.complete(req.params.id);
    res.json({ success: true, data: convertBigInt(activity) });
  } catch (error) {
    next(error);
  }
}

// Get upcoming activities
async function getUpcoming(req, res, next) {
  try {
    const { owner_id, limit } = req.query;
    
    if (!owner_id) {
      return res.status(400).json({ success: false, error: 'owner_id is required' });
    }
    
    const activities = await Activity.getUpcoming(owner_id, parseInt(limit) || 10);
    res.json({ success: true, data: convertBigInt(activities) });
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
  complete,
  getUpcoming,
};
