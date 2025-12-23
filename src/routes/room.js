const express = require('express');
const roomController = require('../controllers/roomController');
const router = express.Router();

router.post('/', roomController.create);


router.get('/floor/:floor_id', roomController.getByFloor);


router.post('/allocate', roomController.allocateToGuest);

router.get('/', roomController.getAll);
router.get('/:id', roomController.getById);
router.put('/:id', roomController.update);
router.delete('/:id', roomController.delete);
router.get('/guest/:guest_id', roomController.getGuestRoom);

module.exports = router;
