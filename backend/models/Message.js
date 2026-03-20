const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  group:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  type:    { type: String, enum: ['text', 'system'], default: 'text' },
  readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
