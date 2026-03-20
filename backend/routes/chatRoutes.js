const router = require('express').Router();
const { getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/:groupId', getMessages);
module.exports = router;
