const Dashboard = require('../models/Dashboard');
const convertBigInt = require('../utils/convertBigInt');

// Get dashboard metrics
async function getMetrics(req, res, next) {
  try {
    const { owner_id } = req.query;
    const metrics = await Dashboard.getMetrics({ owner_id });
    res.json({ success: true, data: convertBigInt(metrics) });
  } catch (error) {
    next(error);
  }
}

// Get contacts by status
async function getContactsByStatus(req, res, next) {
  try {
    const distribution = await Dashboard.getContactsByStatus();
    res.json({ success: true, data: convertBigInt(distribution) });
  } catch (error) {
    next(error);
  }
}

// Get deals summary (won/lost)
async function getDealsSummary(req, res, next) {
  try {
    const summary = await Dashboard.getDealsSummary();
    res.json({ success: true, data: convertBigInt(summary) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMetrics,
  getContactsByStatus,
  getDealsSummary,
};
