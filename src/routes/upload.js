const express = require('express');
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const router = express.Router();

router.post('/units', upload.single('shapefile'), uploadController.uploadUnits);
router.post('/routes', upload.single('shapefile'), uploadController.uploadRoutes);
router.post('/pois', upload.single('shapefile'), uploadController.uploadPois);

module.exports = router;