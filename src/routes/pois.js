const express = require('express');
const poiController = require('../controllers/poiController');
const router = express.Router();

router.post('/', poiController.create);
router.get('/', poiController.getAll);
router.get('/:id', poiController.getById);
router.put('/:id', poiController.update);
router.delete('/:id', poiController.delete);

module.exports = router;