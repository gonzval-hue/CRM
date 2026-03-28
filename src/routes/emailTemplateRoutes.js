const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');

// GET /api/email-templates - List all templates
router.get('/', emailTemplateController.getAll);

// GET /api/email-templates/:id - Get template by ID
router.get('/:id', emailTemplateController.getById);

// GET /api/email-templates/category/:category - Get templates by category
router.get('/category/:category', emailTemplateController.getByCategory);

// POST /api/email-templates - Create new template
router.post('/', emailTemplateController.create);

// PUT /api/email-templates/:id - Update template
router.put('/:id', emailTemplateController.update);

// DELETE /api/email-templates/:id - Delete template
router.delete('/:id', emailTemplateController.remove);

module.exports = router;
