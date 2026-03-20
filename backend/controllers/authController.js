const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateResetToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });
    
    // Admin role is EXCLUSIVE to the seeded email. All new registrations are 'user'.
    const role = 'user';
    const uid = '#' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const user = await User.create({ name, email, password, role, uid });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, uid: user.uid },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, uid: user.uid },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('friends', 'name avatar email')
    .populate('groups', 'name emoji color');
  res.json(user);
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No user with that email' });

    const { raw, hashed } = generateResetToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${raw}`;
    await sendEmail({
      to: user.email,
      subject: '🔑 Password Reset — Social Sticky Notes',
      html: `
        <h2>Reset Your Password</h2>
        <p>Click the link below (expires in 10 minutes):</p>
        <a href="${resetUrl}" style="background:#FFD93D;padding:10px 20px;border-radius:8px;text-decoration:none;color:#1a1a1a;font-weight:bold;">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    res.json({ message: 'Reset email sent!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
