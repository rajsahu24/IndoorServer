const express = require('express');
const { bookingController, upload } = require('../controllers/bookingController');
const router = express.Router();

router.post('/', upload.single('file'), bookingController.create);
router.get('/', bookingController.getAll);
router.get('/:id', bookingController.getById);
router.put('/:id', bookingController.update);
router.delete('/:id', bookingController.delete);

// Guest management
router.post('/:booking_id/guests/bulk', bookingController.bulkUploadGuests);

// Upload guests with room allocation
router.post('/:booking_id/guests/upload-allocate', upload.single('file'), bookingController.uploadGuestsWithAllocation);

module.exports = router;