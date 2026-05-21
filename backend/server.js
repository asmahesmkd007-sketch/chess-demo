// CHESS OX Backend - Listener Layer
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = require('./app');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: (origin, callback) => {
      const allowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
      if (!origin || allowed.indexOf(origin) !== -1 || origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('onrender.com') || origin.includes('chessox.com')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 10000, 
  pingInterval: 5000, 
});

app.set('io', io);

// ─── SOCKET.IO Matchmaking ────────────────────────────────
require(path.join(__dirname, './socket/socket'))(io);

// ─── LOBBY SERVICES ───────────────────────────────────────
const RoomManager = require('./services/room.manager');
RoomManager.init(io);

// ─── SCHEDULERS ───────────────────────────────────────────
const { updateTournamentStatuses } = require('./controllers/tournament.controller');

// Update tournament statuses every 30 seconds
setInterval(updateTournamentStatuses, 30 * 1000);

// ─── ENVIRONMENT VERIFICATION ─────────────────────────────
const requiredEnv = [
  'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 
  'PHONEPE_MERCHANT_ID', 'PHONEPE_SALT_KEY',
  'JWT_SECRET'
];

requiredEnv.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ CRITICAL ERROR: Environment variable ${env} is missing!`);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('  ♔  CHESS OX — Online Chess Platform (Modular)');
  console.log('  ─────────────────────────────────────');
  console.log(`  🚀  Server   : http://localhost:${PORT}`);
  console.log(`  🗄  Database : Supabase (PostgreSQL)`);
  console.log(`  🔌  Socket   : Socket.IO ready`);
  console.log('');
});

module.exports = { server, io };
