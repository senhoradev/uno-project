const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

router.get('/', cardController.getAll);
router.post('/', cardController.create);
router.get('/:id', cardController.getById);
router.put('/:id', cardController.update);
router.delete('/:id', cardController.delete);

module.exports = router;