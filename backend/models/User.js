const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  gender: { type: String, enum: ['male', 'female', 'other', 'custom'], default: 'male' },
  uid: { type: String, unique: true, sparse: true, uppercase: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  avatarIcon: { type: String, default: '😎' },
  statusMessage: { type: String, default: 'Living my best life ✨' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },

  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: {
    sent:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    received: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },

  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],

  // Personal goals for gamification / progress tracking
  goals: [{
    title: { type: String, required: true },
    targetDate: { type: Date },
    progress: { type: Number, default: 0 }, // 0-100
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    // Headings and subtasks structure
    headings: [{
      title: { type: String, required: true },
      subtasks: [{ title: String, completed: { type: Boolean, default: false }, auraAwarded: { type: Boolean, default: false } }],
    }],
  }],
  // User Context for AI Personality
  dreams: { type: String, default: '' },
  habits: { type: String, default: '' },
  motivations: { type: String, default: '' },

  aura: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  currentStreak: { type: Number, default: 0 },
  dailyTaskCount: { type: Number, default: 0 },
  lastTaskDate: { type: String }, // 'YYYY-MM-DD'
  lastTaskCompletedAt: { type: Date },
  lastClaimAt: { type: Date }, // For daily 24h claim countdown

  // Chad Attributes
  momentum: { type: Number, default: 10 }, // Range 1-100
  focusPower: { type: Number, default: 0 }, // Based on distractions avoided 
  focusTimeTotal: { type: Number, default: 0 }, // Total minutes focused
  
  // Settings
  aiTone: { type: String, enum: ['motivational', 'funny', 'savage'], default: 'motivational' },

  resetPasswordToken:   String,
  resetPasswordExpire:  Date,
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('levelTitle').get(function() {
  const titles = [
    { lvl: 0, t: 'Beginner 🐣' },
    { lvl: 5, t: 'Getting Serious 😤' },
    { lvl: 15, t: 'Disciplined 🧠' },
    { lvl: 30, t: 'Machine ⚙️' },
    { lvl: 60, t: 'Unstoppable 🔥' },
    { lvl: 100, t: 'Legend 🗿' }
  ];
  let current = titles[0].t;
  for (const item of titles) {
    if (this.level >= item.lvl) current = item.t;
    else break;
  }
  return current;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.calculateLevel = function() {
  // Formula: threshold(l) = 120 * (l-1)^2.2
  // Binary search for the highest level whose threshold <= aura
  const aura = this.aura || 0;
  if (aura < 120) return 1;
  let lo = 1, hi = 1001;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const threshold = Math.floor(120 * Math.pow(mid - 1, 2.2));
    if (threshold <= aura) lo = mid;
    else hi = mid - 1;
  }
  return Math.min(lo, 1000);
};

userSchema.methods.awardTaskAura = async function() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Reset daily count if new day
  if (this.lastTaskDate !== dateStr) {
    this.dailyTaskCount = 0;
    this.lastTaskDate = dateStr;
    
    // Streak logic: if last task was yesterday, increment streak. 
    if (this.lastTaskCompletedAt) {
      const last = new Date(this.lastTaskCompletedAt);
      const diffMs = now - last;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours <= 48) {
        this.currentStreak = (this.currentStreak || 0) + 1;
      } else {
        this.currentStreak = 0; 
      }
    } else {
      this.currentStreak = 1;
    }
  }

  this.dailyTaskCount += 1;
  
  // Formula: Aura = 10 * 1.3^(n-1)
  const auraAward = Math.round(10 * Math.pow(1.3, this.dailyTaskCount - 1));
  
  // Momentum: increase based on daily count
  this.momentum = Math.min(100, (this.momentum || 10) + 2);

  this.aura = (this.aura || 0) + auraAward;
  this.lastTaskCompletedAt = now;
  this.level = this.calculateLevel();

  // 10% Chance for Random Bonus Aura (+20)
  let bonus = 0;
  if (Math.random() < 0.1) {
    bonus = 20;
    this.aura += bonus;
  }

  return { auraAward, bonus };
};

module.exports = mongoose.model('User', userSchema);
