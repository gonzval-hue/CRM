const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// GET /api/companies - List all companies
router.get('/', companyController.getAll);

// GET /api/companies/:id - Get company by ID
router.get('/:id', companyController.getById);

// POST /api/companies - Create new company
router.post('/', companyController.create);

// PUT /api/companies/:id - Update company
router.put('/:id', companyController.update);

// DELETE /api/companies/:id - Delete company
router.delete('/:id', companyController.remove);

module.exports = router;
