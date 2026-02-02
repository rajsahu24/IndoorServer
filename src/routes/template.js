const express = require('express');
const templateController = require('../controllers/templateController');
const router = express.Router();

router.post('/', templateController.create);
router.get('/', templateController.getAll);
router.get('/:id', templateController.getById);
router.put('/:id', templateController.update);
router.delete('/:id', templateController.delete);

module.exports = router;