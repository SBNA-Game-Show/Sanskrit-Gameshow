const express = require('express');
const router = express.Router();
const {
  submitResponse,
  getScores
} = require('../controllers/questionResponse.controller');

// ✅ Import the authentication middleware
const authenticate = require('../middlewares/authenticate');

router.post('/submit', authenticate, submitResponse); // Authenticated route
router.get('/scores', getScores);

module.exports = router;
