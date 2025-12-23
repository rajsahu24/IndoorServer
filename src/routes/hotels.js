const express = require('express');
const hotelController = require('../controllers/hotelController');
const router = express.Router();

router.post('/', hotelController.create);
router.get('/', hotelController.getAll);
router.get('/:id', hotelController.getById);
router.post('/:id/bookings', hotelController.createBooking);
router.post('/bookings/:booking_id/guests/bulk', hotelController.bulkUploadGuests);
router.put('/:id', hotelController.update);
router.delete('/:id', hotelController.delete);

module.exports = router;