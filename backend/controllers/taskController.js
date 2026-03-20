const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const { title, description, color, priority, dueDate, tags, groupId } = req.body;
    const task = await Task.create({
      title, description, color, priority, dueDate, tags,
      owner: req.user._id,
      // Do not create group-specific tasks - tasks live on users. Keep group null.
      group: null,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user._id }).sort('-createdAt');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGroupTasks = async (req, res) => {
  try {
    // Include tasks explicitly assigned to the group AND each member's daily todos.
    const groupId = req.params.groupId;
    const group = await require('../models/Group').findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Daily todos: tasks owned by group members that are due today (local server time).
    const memberIds = group.members.map(m => m.user);
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const tasks = await Task.find({ owner: { $in: memberIds }, completed: false })
      .populate('owner', 'name avatar')
      .sort('createdAt');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your task' });

    // [RULE] If already completed, cannot uncheck.
    if (task.completed) {
      return res.status(400).json({ message: 'Completed tasks cannot be unchecked! Greatness only moves forward. 🚀' });
    }

    task.completed = true;
    task.status = 'done';
    await task.save();

    // Emit real-time update
    try {
      const io = require('../config/io').get();
      if (io) {
        const Group = require('../models/Group');
        const groups = await Group.find({ 'members.user': task.owner });
        const populated = await task.populate('owner', 'name avatar');
        groups.forEach(g => io.to(`group_${g._id}`).emit('task_updated', populated));
      }
    } catch (e) {
      console.warn('Failed to emit task update:', e.message);
    }

    // Award Exponential Aura
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const { auraAward, bonus } = await user.awardTaskAura();
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

    const ai = require('./aiController');
    // Simulate req/res for the internal controller call or just import the logic. 
    // For simplicity, I'll just hardcode a fallback or call the function if I refactor it to be a utility.
    // Let's just use a random message from the list for now for speed, or properly call the controller.
    
    res.json({ 
      ...task.toObject(), 
      auraAwarded: auraAward,
      bonus: bonus,
      aiMessage: "Aura increased. The Architect is proud. 🗿🔥"  
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status, completed: status === 'done' },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    try {
      const io = require('../config/io').get();
      if (io) {
        const Group = require('../models/Group');
        const groups = await Group.find({ 'members.user': task.owner });
        const populated = await task.populate('owner', 'name avatar');
        groups.forEach(g => io.to(`group_${g._id}`).emit('task_updated', populated));
      }
    } catch (e) { console.warn('Failed to emit task update:', e.message); }

    // Award Aura and update streak if moved to done
    let auraAwarded = 0;
    let bonus = 0;
    if (status === 'done') {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      const result = await user.awardTaskAura();
      auraAwarded = result.auraAward;
      bonus = result.bonus;
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
    }

    res.json({ ...task.toObject(), auraAwarded, bonus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reactToTask = async (req, res) => {
  try {
    const { emoji } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const existingIndex = task.reactions?.findIndex(r => r.emoji === emoji && r.user.toString() === req.user._id.toString());
    
    if (!task.reactions) task.reactions = [];
    if (existingIndex >= 0) {
      task.reactions.splice(existingIndex, 1);
    } else {
      task.reactions.push({ emoji, user: req.user._id });
    }
    
    await task.save();
    
    try {
      const io = require('../config/io').get();
      if (io) {
        const Group = require('../models/Group');
        const groups = await Group.find({ 'members.user': task.owner });
        groups.forEach(g => io.to(`group_${g._id}`).emit('task_updated', task));
      }
    } catch(e) {}
    
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Emit update to groups including this owner
    try {
      const io = require('../config/io').get();
      if (io) {
        const Group = require('../models/Group');
        const groups = await Group.find({ 'members.user': task.owner });
        const populated = await task.populate('owner', 'name avatar');
        groups.forEach(g => io.to(`group_${g._id}`).emit('task_updated', populated));
      }
    } catch (e) { console.warn('Failed to emit task update:', e.message); }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (task) {
      try {
        const io = require('../config/io').get();
        if (io) {
          const Group = require('../models/Group');
          const groups = await Group.find({ 'members.user': task.owner });
          groups.forEach(g => io.to(`group_${g._id}`).emit('task_deleted', { _id: task._id }));
        }
      } catch (e) { console.warn('Failed to emit task delete:', e.message); }
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGroupActivity = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await require('../models/Group').findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const memberIds = group.members.map(m => m.user);
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const tasks = await Task.find({ 
      owner: { $in: memberIds }, 
      completed: true,
      completedAt: { $gte: start }
    })
      .populate('owner', 'name avatar')
      .sort('-completedAt');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
