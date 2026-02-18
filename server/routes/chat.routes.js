const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.get('/users', chatController.getUsers);
router.get('/history/:userId', chatController.getHistory);
router.get('/calls', chatController.getCallLogs);
router.get('/getchats', chatController.getChats);


module.exports = router;
