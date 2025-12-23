const express = require('express');
const unitController = require('../controllers/unitController');
const router = express.Router();

router.post('/', unitController.create);
router.get('/', unitController.getAll);
router.get('/:id', unitController.getById);
router.put('/:id', unitController.update);
router.delete('/:id', unitController.delete);

module.exports = router;