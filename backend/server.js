const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB().then(() => {
  require('./utils/seedAdmin')();
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io available to controllers via a small accessor module
require('./config/io').init(io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',   require('./routes/authRoutes'));
app.use('/api/users',  require('./routes/userRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/tasks',  require('./routes/taskRoutes'));
app.use('/api/chat',   require('./routes/chatRoutes'));
app.use('/api/admin',  require('./routes/adminRoutes'));
app.use('/api/ai',     require('./routes/aiRoutes'));

// Socket.io
require('./config/socket')(io);

const PORT = process.env.PORT || 5001;
// Handle server errors (e.g. port in use) to avoid an unhandled 'error' event
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port or set a different PORT in your environment.`);
    // Exit gracefully so tools like nodemon can restart or the user can take action.
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

// Background Task: Auto-delete messages older than 1 week
const Message = require('./models/Message');
const pruneMessages = async () => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await Message.deleteMany({ createdAt: { $lt: oneWeekAgo } });
    if (result.deletedCount > 0) {
      console.log(`🧹 Pruned ${result.deletedCount} legacy messages.`);
    }
  } catch (err) {
    console.error('❌ Pruning failed:', err);
  }
};

// Start pruning cycle only if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  setInterval(pruneMessages, 24 * 60 * 60 * 1000);
}

// Export for Vercel
module.exports = app;

if (require.main === module) {
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
