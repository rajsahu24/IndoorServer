const express = require('express');
const eventController = require('../controllers/eventController');
const router = express.Router();

router.post('/', eventController.create);
router.get('/', eventController.getEvents);
router.get('/getEventWithVenue/:id', eventController.getEventWithVenue);
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.update);
router.delete('/:id', eventController.delete);
router.post('/:event_id/guests', eventController.assignGuests);
router.get('/guest/:guest_id', eventController.getGuestEvents);
router.post('/:id/notify', eventController.sendEventReminder);

module.exports = router;