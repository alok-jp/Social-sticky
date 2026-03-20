const User = require('../models/User');
const ai = require('./aiController');

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q;
    const users = await User.find({
      uid: { $regex: q, $options: 'i' }, // Search strictly by UID
      _id: { $ne: req.user._id },
    }).select('name avatar uid').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { targetId } = req.params;
    const me = await User.findById(req.user._id);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (me.friends.includes(targetId))
      return res.status(400).json({ message: 'Already friends' });
    if (me.friendRequests.sent.includes(targetId))
      return res.status(400).json({ message: 'Request already sent' });

    me.friendRequests.sent.push(targetId);
    target.friendRequests.received.push(req.user._id);
    await me.save(); await target.save();
    res.json({ message: 'Friend request sent!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const me = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);

    if (!me.friendRequests.received.includes(requesterId))
      return res.status(400).json({ message: 'No request from this user' });

    me.friends.push(requesterId);
    requester.friends.push(req.user._id);
    me.friendRequests.received = me.friendRequests.received.filter(id => id.toString() !== requesterId);
    requester.friendRequests.sent = requester.friendRequests.sent.filter(id => id.toString() !== req.user._id.toString());

    await me.save(); await requester.save();
    res.json({ message: 'Friend request accepted!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Decline / cancel request
exports.declineFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const me = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);

    me.friendRequests.received = me.friendRequests.received.filter(id => id.toString() !== requesterId);
    requester.friendRequests.sent = requester.friendRequests.sent.filter(id => id.toString() !== req.user._id.toString());

    await me.save(); await requester.save();
    res.json({ message: 'Request declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get friends list
exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name email avatar uid currentStreak level')
      .populate('friendRequests.received', 'name email avatar uid')
      .populate('friendRequests.sent', 'name email avatar uid');
    res.json({
      friends: user.friends,
      received: user.friendRequests.received,
      sent: user.friendRequests.sent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, statusMessage, avatarIcon, gender, bio, dreams, habits, motivations } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar, statusMessage, avatarIcon, gender, bio, dreams, habits, motivations },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Goals endpoints
exports.getGoals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('goals');
    res.json(user.goals || []);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUserGoals = async (req, res) => {
  try {
    const isFriend = req.user.friends.includes(req.params.id) || req.user._id.toString() === req.params.id;
    if (!isFriend) return res.status(403).json({ message: 'Must be friends to view goals' });
    const u = await User.findById(req.params.id).select('goals');
    if (!u) return res.status(404).json({ message: 'Not found' });
    const activeGoals = u.goals?.filter(g => !g.completed) || [];
    res.json(activeGoals);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

exports.addGoal = async (req, res) => {
  try {
    const { title, targetDate } = req.body;
    const user = await User.findById(req.user._id);
    const goal = { title, targetDate: targetDate ? new Date(targetDate) : undefined };
    user.goals.unshift(goal);
    await user.save();
    res.status(201).json(user.goals[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title, targetDate, progress, completed } = req.body;
    const user = await User.findById(req.user._id);
    const g = user.goals.id(goalId);
    if (!g) return res.status(404).json({ message: 'Goal not found' });
    if (title !== undefined) g.title = title;
    if (targetDate !== undefined) g.targetDate = targetDate ? new Date(targetDate) : undefined;
    if (progress !== undefined) g.progress = Math.max(0, Math.min(100, progress));
    if (completed !== undefined) {
      if (!!completed && !g.completed) g.completedAt = new Date();
      g.completed = !!completed;
    }
    await user.save();
    res.json(g);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const user = await User.findById(req.user._id);
    user.goals = user.goals.filter(g => g._id.toString() !== goalId);
    await user.save();
    const aiMessage = await ai.generateMessage(user._id, 'delete_goal');
    res.json({ message: 'Goal removed', aiMessage });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Headings / Subtasks management
exports.addHeading = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title } = req.body;
    const user = await User.findById(req.user._id);
    const g = user.goals.id(goalId);
    if (!g) return res.status(404).json({ message: 'Goal not found' });
    g.headings.push({ title, subtasks: [] });
    await user.save();
    res.status(201).json(g.headings[g.headings.length-1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addSubtask = async (req, res) => {
  try {
    const { goalId, headingId } = req.params;
    const { title } = req.body;
    const user = await User.findById(req.user._id);
    const g = user.goals.id(goalId);
    if (!g) return res.status(404).json({ message: 'Goal not found' });
    const h = g.headings.id(headingId);
    if (!h) return res.status(404).json({ message: 'Heading not found' });
    h.subtasks.push({ title, completed: false, xpAwarded: false });
    await user.save();
    res.status(201).json(h.subtasks[h.subtasks.length-1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Toggle subtask completion; when completed first time award XP and recalc goal progress
exports.toggleSubtask = async (req, res) => {
  try {
    const { goalId, headingId, subtaskId } = req.params;
    const user = await User.findById(req.user._id);
    const g = user.goals.id(goalId);
    if (!g) return res.status(404).json({ message: 'Goal not found' });
    const h = g.headings.id(headingId);
    if (!h) return res.status(404).json({ message: 'Heading not found' });
    const s = h.subtasks.id(subtaskId);
    if (!s) return res.status(404).json({ message: 'Subtask not found' });

    // [RULE] If already completed, cannot uncheck.
    if (s.completed) {
      return res.status(400).json({ message: 'Step already completed! Keep moving forward. 🚀' });
    }

    s.completed = true;

    // Recalculate progress: completed subtasks / total subtasks
    const allSubtasks = g.headings.reduce((acc, hd) => acc.concat(hd.subtasks), []);
    const total = allSubtasks.length || 1;
    const done = allSubtasks.filter(x => x.completed).length;
    g.progress = Math.round((done / total) * 100);
    if (g.progress >= 100 && !g.completed) {
      g.completed = true;
      g.completedAt = new Date();
    }

    // Award Exponential Aura for every step completed
    const auraAwarded = await user.awardTaskAura();
    
    await user.save();

    // Emit leaderboard update
    try {
      const io = require('../config/io').get();
      if (io) {
        const payload = { userId: user._id, aura: user.aura, level: user.level, streak: user.currentStreak };
        user.friends?.forEach(fid => io.to(`user_${fid}`).emit('leaderboard_update', payload));
        io.to(`user_${user._id}`).emit('leaderboard_update', payload);
      }
    } catch (e) { console.warn('emit leaderboard failed', e.message); }

    const aiMessage = await ai.generateMessage(user._id, 'complete_task');
    res.json({ ...g.toObject(), auraAwarded: auraAwarded.auraAward, aiMessage });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/users/ritual - award 10 Aura if 24h passed
exports.claimDailyAura = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    if (user.lastClaimAt) {
      const waitTime = 24 * 60 * 60 * 1000;
      const diff = now - user.lastClaimAt;
      if (diff < waitTime) {
        const remaining = Math.ceil((waitTime - diff) / 1000);
        return res.status(400).json({ 
          message: `Patience, Alpha. Aura ritual available in ${Math.floor(remaining/3600)}h ${Math.floor((remaining%3600)/60)}m.`,
          secondsRemaining: remaining 
        });
      }
    }

    user.aura = (user.aura || 0) + 15; // Increased to 15 for the new ritual
    user.lastClaimAt = now;
    user.level = user.calculateLevel();
    await user.save();

    // Notify friends and self
    try {
      const io = require('../config/io').get();
      if (io) {
        const payload = { userId: user._id, aura: user.aura, level: user.level, streak: user.currentStreak };
        user.friends?.forEach(fid => io.to(`user_${fid}`).emit('leaderboard_update', payload));
        io.to(`user_${user._id}`).emit('leaderboard_update', payload);
      }
    } catch (e) { console.warn('emit leaderboard failed', e.message); }

    res.json({ aura: user.aura, lastClaimAt: user.lastClaimAt });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Leaderboard among friends + self
exports.getLeaderboard = async (req, res) => {
  try {
    const { sortBy = 'aura' } = req.query; // 'aura', 'streak', 'level'
    const me = await User.findById(req.user._id).populate('friends', 'name uid aura currentStreak level avatar');
    
    const list = (me.friends || []).map(f => ({
      _id: f._id,
      name: f.name, 
      uid: f.uid,
      avatar: f.avatar,
      aura: f.aura || 0,
      streak: f.currentStreak || 0,
      level: f.level || 1,
    }));
    
    // include self
    list.push({
      _id: me._id,
      name: me.name,
      uid: me.uid,
      avatar: me.avatar,
      aura: me.aura || 0,
      streak: me.currentStreak || 0,
      level: me.level || 1,
    });

    if (sortBy === 'streak') list.sort((a,b) => b.streak - a.streak);
    else if (sortBy === 'level') list.sort((a,b) => b.level - a.level);
    else list.sort((a,b) => b.aura - a.aura);

    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /api/users/settings - update mc mode, ai tone etc
exports.updateSettings = async (req, res) => {
  try {
    const { name, avatar, avatarIcon, statusMessage, dreams, habits, motivations } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (avatarIcon) user.avatarIcon = avatarIcon;
    if (statusMessage) user.statusMessage = statusMessage;
    if (dreams !== undefined) user.dreams = dreams;
    if (habits !== undefined) user.habits = habits;
    if (motivations !== undefined) user.motivations = motivations;

    await user.save();
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Remove a friend
exports.removeFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friendId = req.params.targetId;

    if (!user.friends.includes(friendId)) {
      return res.status(400).json({ message: 'User is not in your friends list' });
    }

    user.friends.pull(friendId);
    await user.save();

    const friend = await User.findById(friendId);
    if (friend) {
      friend.friends.pull(user._id);
      await friend.save();
    }

    res.json({ message: 'Friend removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeFocusSession = async (req, res) => {
  try {
    const { minutes } = req.body;
    if (!minutes || minutes <= 0) return res.status(400).json({ message: 'Invalid duration' });
    
    const user = await User.findById(req.user._id);
    // Award 2 Aura per minute focused + periodic bonus
    const auraGain = Math.round(minutes * 2);
    user.aura = (user.aura || 0) + auraGain;
    user.focusTimeTotal = (user.focusTimeTotal || 0) + minutes;
    
    // 5% bonus chance
    let bonus = 0;
    if (Math.random() < 0.05) {
      bonus = 50;
      user.aura += bonus;
    }
    
    user.level = user.calculateLevel();
    await user.save();
    
    const aiMessage = await ai.generateMessage(user._id, 'complete_task'); // Reuse praise logic
    res.json({ 
      aura: user.aura, 
      level: user.level, 
      focusTimeTotal: user.focusTimeTotal,
      auraGain,
      bonus,
      aiMessage: `Session complete! +${auraGain}${bonus ? ` (+${bonus} CHAD BONUS)` : ''} Aura. ${aiMessage}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.abandonFocusSession = async (req, res) => {
  try {
    const { minutesSpent } = req.body;
    const user = await User.findById(req.user._id);
    
    // Deduct 20 Aura for abandonment (Thanos rule)
    const penalty = 20;
    user.aura = Math.max(0, (user.aura || 0) - penalty);
    user.focusTimeTotal = (user.focusTimeTotal || 0) + (minutesSpent || 0);
    
    user.level = user.calculateLevel();
    await user.save();
    
    const aiMessage = await ai.generateMessage(user._id, 'mission_failed'); // Custom roast logic
    res.json({ 
      aura: user.aura, 
      level: user.level, 
      penalty,
      aiMessage: `Mission Abandoned. -${penalty} Aura. ${aiMessage}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
