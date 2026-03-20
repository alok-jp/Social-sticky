const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

// @GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/admin/groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({}).populate('creator', 'name email').sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/admin/groups/:groupId/chats
exports.getGroupChats = async (req, res) => {
  try {
    const { groupId } = req.params;
    const chats = await Message.find({ group: groupId }).populate('sender', 'name email avatarIcon').sort({ createdAt: 1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/admin/groups/:groupId
exports.deleteGroup = async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.groupId);
    await Message.deleteMany({ group: req.params.groupId });
    res.json({ message: 'Group and its history deleted by Admin. 🗿' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
