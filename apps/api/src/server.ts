// apps/api/src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // MUST BE AT THE VERY TOP

import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import { backfillMissingCompanySlugs } from './utils/companySlug';

const server = http.createServer(app);

// 1. Socket.IO Setup
const allowedSocketOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];
const isLocalhostOrigin = (origin?: string | null) => {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow no-origin requests
      if (!origin) return callback(null, true);
      if (allowedSocketOrigins.indexOf(origin) !== -1 || isLocalhostOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS']
  }
});
app.set('io', io);

// 1b. Fail closed if the JWT secret is missing/weak — otherwise tokens are
// signed/verified with an undefined or guessable key (silent auth bypass).
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("❌ JWT_SECRET missing or too weak (need ≥16 chars) in .env");
  process.exit(1);
}

// 2. Database Connection
const dbUri = process.env.MONGO_URI;
if (!dbUri) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

// Retry the INITIAL connection instead of giving up after a single failure
// (transient DNS/Atlas blips were leaving the server up with a dead DB).
const connectWithRetry = async (attempt = 1): Promise<void> => {
  try {
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ BuildHub DB Connected Successfully");
    await backfillMissingCompanySlugs(); // runs once, on first successful connect
  } catch (err: any) {
    const delay = Math.min(30000, attempt * 3000); // 3s, 6s, 9s … capped at 30s
    console.error(`❌ DB connect attempt ${attempt} failed: ${err.message} — retrying in ${delay / 1000}s`);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
};
connectWithRetry();

// Once connected, the driver auto-reconnects on later drops — just log it.
mongoose.connection.on('disconnected', () => console.warn("⚠️  DB disconnected — auto-reconnecting…"));
mongoose.connection.on('reconnected', () => console.log("✅ DB reconnected"));
mongoose.connection.on('error', (err) => console.error("❌ DB connection error:", err.message));

// 3. Real-time Comms
io.on('connection', (socket) => {
  console.log(`👤 Connected: ${socket.id}`);

  socket.on('join_room', (userId: string) => {
    socket.join(userId);
    console.log(`🏠 Room Joined: ${userId}`);
  });

  socket.on('join_community_post', (postId: string) => {
    socket.join(`post_${postId}`);
    console.log(`📖 Joined Community Post: ${postId}`);
  });

  socket.on('leave_community_post', (postId: string) => {
    socket.leave(`post_${postId}`);
    console.log(`🚪 Left Community Post: ${postId}`);
  });

  socket.on('send_message', (data) => {
    if (data.receiverId) {
      io.to(data.receiverId).emit('receive_message', data);
    }
  });

  socket.on('disconnect', () => console.log(`🔌 Disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 BuildHub API v4.0 LIVE on port ${PORT}`);
});