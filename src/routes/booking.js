const express = require('express');
const bookingController = require('../controllers/bookingController');
const router = express.Router();


router.post('/', bookingController.create);

router.get('/', bookingController.getAll);

router.get('/:id', bookingController.getById);

router.post('/:booking_id/guests/bulk', bookingController.bulkUploadGuests);

router.put('/:id', bookingController.update);

router.delete('/:id', bookingController.delete);

module.exports = router;
