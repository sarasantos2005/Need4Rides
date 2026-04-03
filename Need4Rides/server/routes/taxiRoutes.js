const express = require('express');
const taxiController = require('../controllers/taxiController');

const router = express.Router();
router.post('/', taxiController.create);
router.delete('/:id', taxiController.delete);

module.exports = router;