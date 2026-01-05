const express = require('express');
const { guestController, upload } = require('../controllers/guestController');
const router = express.Router();

router.post('/', guestController.create);
router.get('/', guestController.getAll);
router.get('/booking/:booking_id', guestController.getByBooking);
router.get('/:id', guestController.getById);
router.put('/:id', guestController.update);
router.delete('/:id', guestController.delete);

// Bulk booking with file upload
router.post('/bulk-booking', upload.single('file'), guestController.bulkBooking);

// Simple guest upload without room allocation
router.post('/upload', upload.single('file'), guestController.uploadGuests);

module.exports = router;