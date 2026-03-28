const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// GET /api/contacts - List all contacts
router.get('/', contactController.getAll);

// GET /api/contacts/:id - Get contact by ID
router.get('/:id', contactController.getById);

// POST /api/contacts - Create new contact
router.post('/', contactController.create);

// PUT /api/contacts/:id - Update contact
router.put('/:id', contactController.update);

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', contactController.remove);

// GET /api/companies/:companyId/contacts - Get contacts by company
router.get('/company/:companyId', contactController.getByCompany);

module.exports = router;
