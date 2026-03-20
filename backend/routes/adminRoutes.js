const router = require('express').Router();
const { getAllUsers, getAllGroups, getGroupChats, deleteGroup } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.use(protect);
router.use(admin);

router.get('/users', getAllUsers);
router.get('/groups', getAllGroups);
router.get('/groups/:groupId/chats', getGroupChats);
router.delete('/groups/:groupId', deleteGroup);

module.exports = router;
