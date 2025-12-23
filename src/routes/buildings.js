const express = require('express');
const buildingController = require('../controllers/buildingController');
const router = express.Router();

router.post('/', buildingController.create);
router.get('/', buildingController.getAll);
router.get('/:id', buildingController.getById);
router.put('/:id', buildingController.update);
router.delete('/:id', buildingController.delete);

module.exports = router;
