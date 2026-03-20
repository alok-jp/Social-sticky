const router = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/search', c.searchUsers);
router.get('/friends', c.getFriends);
router.delete('/friends/:targetId', c.removeFriend);
router.post('/friend-request/:targetId', c.sendFriendRequest);
router.post('/friend-request/accept/:requesterId', c.acceptFriendRequest);
router.post('/friend-request/decline/:requesterId', c.declineFriendRequest);
router.put('/profile', c.updateProfile);
// Goals
router.get('/goals', require('../controllers/userController').getGoals);
router.get('/:id/goals', require('../controllers/userController').getUserGoals);
router.post('/goals', c.addGoal);
router.put('/goals/:goalId', c.updateGoal);
router.delete('/goals/:goalId', c.deleteGoal);
// Headings / subtasks
router.post('/goals/:goalId/headings', c.addHeading);
router.post('/goals/:goalId/headings/:headingId/subtasks', c.addSubtask);
router.patch('/goals/:goalId/headings/:headingId/subtasks/:subtaskId/toggle', c.toggleSubtask);
// Daily Aura Ritual
router.post('/ritual', c.claimDailyAura);
// Leaderboard
router.get('/leaderboard', c.getLeaderboard);
// Focus Mode
router.post('/focus/complete', c.completeFocusSession);
router.post('/focus/abandon', c.abandonFocusSession);
// AI Reaction
router.post('/ai/reaction', require('../controllers/aiController').getReaction);
// User Settings
router.patch('/settings', c.updateSettings);
module.exports = router;
