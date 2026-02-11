const express = require('express');
const router = express.Router();
const templateSectionController = require('../controllers/templateSectionController');


router.post('/', templateSectionController.create);
router.get('/', templateSectionController.getAll);
router.get('/:id', templateSectionController.getById);
router.put('/:id', templateSectionController.update);
router.delete('/:id', templateSectionController.delete);
router.get('/invitation/:id', templateSectionController.getByInvitationId);
module.exports = router;