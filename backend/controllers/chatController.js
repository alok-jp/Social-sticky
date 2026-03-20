const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate('sender', 'name avatar')
      .sort('createdAt')
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
