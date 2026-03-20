const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color:       { type: String, default: '#FFD93D' },
  priority:    { type: String, enum: ['low', 'medium', 'urgent'], default: 'medium' },
  status:      { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  dueDate:     { type: Date },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
  tags:        [{ type: String }],

  owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group:  { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },

  // Optional handler assigned to this task (e.g., admin or other user)
  handler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  reactions: [{
    emoji: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Gamification
  xpReward: { type: Number, default: 10 },
}, { timestamps: true });

taskSchema.pre('save', function (next) {
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
