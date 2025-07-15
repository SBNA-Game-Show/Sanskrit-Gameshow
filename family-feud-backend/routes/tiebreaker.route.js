const express = require('express');
const router = express.Router();

const {
  setTiebreakerQuestion,
  getTiebreaker,
  submitTiebreakerAnswer,
  getResult,
} = require('../controllers/tiebreaker.controller'); // ✅ Make sure the path is correct

// ✅ Registering routes with correct function handlers
router.post('/set', setTiebreakerQuestion);
router.get('/', getTiebreaker);
router.post('/submit', submitTiebreakerAnswer);
router.get('/result', getResult);

module.exports = router;
