const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  emoji:       { type: String, default: '📚' },
  color:       { type: String, default: '#FFD93D' },
  creator:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  }],
  pendingInvites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
