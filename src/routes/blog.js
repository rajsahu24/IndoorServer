const express = require('express');
const blogController = require('../controllers/blogController');
const upload = require('../middleware/upload');
const { route } = require('./units');
const router = express.Router();

router.post('/', upload.single('image'), blogController.create);
router.get('/', blogController.getAll);
router.get('/slug/:slug', blogController.getBySlug);
router.get('/:id', blogController.getById);
router.put('/:id', upload.single('image'), blogController.update);
router.delete('/:id', blogController.delete);

module.exports = router;