const express = require('express');
const taxiController = require('../controllers/taxiController');

const router = express.Router();
router.get('/', taxiController.list);
router.post('/', taxiController.create);
router.delete('/:id', taxiController.delete);

module.exports = router;