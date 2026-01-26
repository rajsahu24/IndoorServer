const express = require('express');
const buildingController = require('../controllers/buildingController');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, requireRole(['admin']), buildingController.create);
router.get('/', auth, requireRole(['admin']), buildingController.getAll);
router.get('/:id', auth, requireRole(['admin']), buildingController.getById);
router.put('/:id', auth, requireRole(['admin']), buildingController.update);
router.delete('/:id', auth, requireRole(['admin']), buildingController.delete);

module.exports = router;
