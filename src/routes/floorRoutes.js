const express = require('express');
const floorController = require('../controllers/floorController');
const router = express.Router();

router.post('/', floorController.create);
router.get('/', floorController.getAll);
router.get('/:id', floorController.getById);
router.put('/:id', floorController.update);
router.delete('/:id', floorController.delete);

module.exports = router;
