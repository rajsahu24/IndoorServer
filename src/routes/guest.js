const express = require('express');
const guestController = require('../controllers/guestController');
const router = express.Router();


router.post('/', guestController.create);

router.get('/booking/:booking_id', guestController.getByBooking);

router.get('/:id', guestController.getById);

router.put('/:id', guestController.update);

router.delete('/:id', guestController.delete);

module.exports = router;
