const router = require('express').Router();
const c = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.post('/', c.createGroup);
router.get('/', c.getMyGroups);
router.get('/pending', c.getPendingInvites);
// NOTE: keep /pending above /:id to avoid route collision
router.get('/:id', c.getGroupById);
router.post('/:id/invite', c.inviteMember);
router.post('/:id/accept-invite', c.acceptInvite);
router.post('/:id/decline', c.declineInvite);
router.delete('/:id/leave', c.leaveGroup);
router.delete('/:id/members/:userId', c.removeMember);
router.delete('/:id/invite/:userId', c.cancelInvite);
router.delete('/:id', c.deleteGroup);
module.exports = router;
