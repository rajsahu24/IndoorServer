const express = require('express');
const bookingController = require('../controllers/bookingController');
const router = express.Router();

router.post('/', bookingController.create);
router.get('/', bookingController.getAll);
router.get('/:id', bookingController.getById);
router.put('/:id', bookingController.update);
router.delete('/:id', bookingController.delete);

// Guest management
router.post('/:booking_id/guests/bulk', bookingController.bulkUploadGuests);

module.exports = router;