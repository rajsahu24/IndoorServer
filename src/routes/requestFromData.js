const express = require('express');
const requestFromDataController = require('../controllers/requestFromDataController');
const router = express.Router();

router.post('/', requestFromDataController.create);

router.get('/', requestFromDataController.getAll);
router.get('/:id', requestFromDataController.getById);
// router.put('/:id', requestFromDataController.update);
// router.delete('/:id', requestFromDataController.delete);
// router.get('/guest/:guest_id', requestFromDataController.getGuestRoom);

module.exports = router;