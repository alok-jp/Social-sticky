const router = require('express').Router();
const c = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
router.use(protect);

router.get('/motivate', c.getMotivation);
router.post('/action', c.handleActionReaction);

module.exports = router;
