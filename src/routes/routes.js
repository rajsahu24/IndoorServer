const express = require('express');
const routeController = require('../controllers/routeController');
const router = express.Router();

router.post('/', routeController.create);
router.get('/', routeController.getAll);
router.get('/:id', routeController.getById);
router.put('/:id', routeController.update);
router.delete('/:id', routeController.delete);

module.exports = router;