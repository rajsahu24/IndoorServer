const express = require('express');
const roomAllocationController = require('../controllers/roomAllocationController');
const router = express.Router();

router.post('/', roomAllocationController.create);
router.get('/', roomAllocationController.getAll);
router.get('/:id', roomAllocationController.getById);
router.put('/:id', roomAllocationController.update);
router.delete('/:id', roomAllocationController.delete);

module.exports = router;
