const Group = require('../models/Group');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, emoji, color, isPrivate } = req.body;
    const group = await Group.create({
      name, description, emoji, color, isPrivate,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { groups: group._id } });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'name avatar email')
      .populate('creator', 'name avatar');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingInvites = async (req, res) => {
  try {
    const groups = await Group.find({ pendingInvites: req.user._id })
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar');
    res.json(groups);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name avatar email')
      .populate('pendingInvites', 'name avatar uid')
      .populate('creator', 'name avatar');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Auto-prune messages older than 1 week
    const Message = require('../models/Message');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await Message.deleteMany({ group: group._id, createdAt: { $lt: oneWeekAgo } });

    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelInvite = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can cancel invites' });

    group.pendingInvites = group.pendingInvites.filter(id => id.toString() !== userId);
    await group.save();
    res.json({ message: 'Invite revoked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.find(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can invite' });
  const alreadyMember = group.members.some(m => m.user.toString() === userId);
  if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

  const alreadyPending = group.pendingInvites.some(id => id.toString() === userId.toString());
  if (alreadyPending) return res.status(400).json({ message: 'Invite already pending' });

  group.pendingInvites.push(userId);
  await group.save();
    
    // AI Reaction
    const inviter = req.user.name;
    const aiMsg = `Brace yourselves... ${inviter} is summoning reinforcements! 🧊⚔️`;
    res.json({ message: 'Invite sent', aiMessage: aiMsg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const hasInvite = group.pendingInvites.some(id => id.toString() === req.user._id.toString());
    if (!hasInvite) return res.status(400).json({ message: 'No pending invite' });

    group.members.push({ user: req.user._id, role: 'member' });
    group.pendingInvites = group.pendingInvites.filter(id => id.toString() !== req.user._id.toString());
    await group.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { groups: group._id } });
    res.json({ message: 'Joined group!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    group.members = group.members.filter(m => m.user.toString() !== req.user._id.toString());
    await group.save();
    await User.findByIdAndUpdate(req.user._id, { $pull: { groups: group._id } });
    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove members' });

    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();
    await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });
    
    res.json({ message: 'Member removed from Tribe' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can delete the Circle' });

    // Remove group from all members' lists
    const memberIds = group.members.map(m => m.user);
    await User.updateMany({ _id: { $in: memberIds } }, { $pull: { groups: group._id } });

    // Delete all messages
    const Message = require('../models/Message');
    await Message.deleteMany({ group: group._id });

    // Delete all tasks associated with the group
    const Task = require('../models/Task');
    await Task.deleteMany({ group: group._id });

    await Group.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Circle disbanded and data purged' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.declineInvite = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const hasInvite = group.pendingInvites.some(id => id.toString() === req.user._id.toString());
    if (!hasInvite) return res.status(400).json({ message: 'No pending invite' });

    group.pendingInvites = group.pendingInvites.filter(id => id.toString() !== req.user._id.toString());
    await group.save();
    res.json({ message: 'Invite declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
