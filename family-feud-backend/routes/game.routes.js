const express = require('express');
const router = express.Router();
const { getCurrentQuestion } = require('../controllers/game.controller');
const authenticate = require('../middlewares/authenticate');

router.get('/current', authenticate, getCurrentQuestion);

module.exports = router;
