const express = require('express');
const eventController = require('../controllers/eventController');
const router = express.Router();

router.post('/', eventController.create);
router.get('/:id', eventController.getEventWithVenue);
router.post('/:event_id/guests', eventController.assignGuests);
router.get('/guest/:guest_id', eventController.getGuestEvents);
router.post('/:id/notify', eventController.sendEventReminder);

module.exports = router;