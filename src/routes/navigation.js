const express = require('express');
const navigationController = require('../controllers/navigationController');
const router = express.Router();

router.get('/pois', navigationController.getPOIsByFloor);
router.get('/route', navigationController.getRoute);
router.get('/to-room', navigationController.getNavigationToRoom);
router.get('/to-venue', navigationController.getNavigationToVenue);

module.exports = router;