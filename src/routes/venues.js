const express = require('express');
const venueController = require('../controllers/venueController');
const router = express.Router();

router.post('/', venueController.create);
router.get('/', venueController.getAll);
router.get('/:id', venueController.getById);
router.put('/:id', venueController.update);
router.delete('/:id', venueController.delete);

module.exports = router;
