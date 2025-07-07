const express = require('express');
const router = express.Router();
const {
  submitResponse,
  getScores
} = require('../controllers/questionResponse.controller');

router.post('/submit', submitResponse);
router.get('/scores', getScores);

module.exports = router;
