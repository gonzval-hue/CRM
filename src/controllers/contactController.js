const Contact = require('../models/Contact');
const convertBigInt = require('../utils/convertBigInt');

// Get all contacts
async function getAll(req, res, next) {
  try {
    const { owner_id, company_id, status, lead_source, search, limit, offset } = req.query;
    const filters = { owner_id, company_id, status, lead_source, search, limit, offset };
    
    const contacts = await Contact.findAll(filters);
    res.json({ success: true, data: convertBigInt(contacts) });
  } catch (error) {
    next(error);
  }
}

// Get contact by ID
async function getById(req, res, next) {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    res.json({ success: true, data: convertBigInt(contact) });
  } catch (error) {
    next(error);
  }
}

// Create new contact
async function create(req, res, next) {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ success: true, data: convertBigInt(contact) });
  } catch (error) {
    next(error);
  }
}

// Update contact
async function update(req, res, next) {
  try {
    const contact = await Contact.update(req.params.id, req.body);
    
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    res.json({ success: true, data: convertBigInt(contact) });
  } catch (error) {
    next(error);
  }
}

// Delete contact
async function remove(req, res, next) {
  try {
    await Contact.delete(req.params.id);
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Get contacts by company
async function getByCompany(req, res, next) {
  try {
    const contacts = await Contact.findByCompanyId(req.params.companyId);
    res.json({ success: true, data: convertBigInt(contacts) });
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
  getByCompany,
};
