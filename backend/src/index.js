require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const subscribeToJudgeEvents = require('./config/redisSubscriber');
const { register, metricsMiddleware, startQueueMetricsPolling } = require('./config/metrics');
const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/', (req, res) => res.send('Online Judge API is running'));

app.get('/health', (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.status(mongoOk ? 200 : 503).json({
    status: mongoOk ? 'ok' : 'degraded',
    mongo: mongoOk ? 'connected' : 'disconnected',
    uptimeSeconds: process.uptime(),
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next();
  }

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join:submission', (submissionId) => {
    socket.join(`submission:${submissionId}`);
  });

  socket.on('leave:submission', (submissionId) => {
    socket.leave(`submission:${submissionId}`);
  });

  socket.on('join:leaderboard', (problemCode) => {
    socket.join(`leaderboard:${problemCode}`);
  });

  socket.on('leave:leaderboard', (problemCode) => {
    socket.leave(`leaderboard:${problemCode}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

subscribeToJudgeEvents(io);
startQueueMetricsPolling();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));