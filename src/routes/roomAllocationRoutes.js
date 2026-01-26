const express = require('express');
const { roomAllocationController, upload } = require('../controllers/roomAllocationController');
const router = express.Router();

router.post('/', roomAllocationController.create);
router.get('/', roomAllocationController.getAll);
router.get('/:id', roomAllocationController.getById);
router.put('/:id', roomAllocationController.update);
router.delete('/:id', roomAllocationController.delete);

// Bulk room allocation API
router.post('/bulk-allocate', roomAllocationController.bulkAllocate);

// Bulk room allocation from file upload
router.post('/bulk-allocate-file', upload.single('file'), roomAllocationController.bulkAllocateFromFile);

module.exports = router;
