// CHESS OX Backend - Application Layer
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────
app.use((req, res, next) => {
  // Only log API requests — skip static file noise
  if (req.url.startsWith('/api/') || req.url.startsWith('/socket.io/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [process.env.FRONTEND_URL || 'http://localhost:3000'];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('onrender.com') || origin.includes('chessox.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/user',        require('./routes/user.routes').userRouter);
app.use('/api/wallet',      require('./routes/wallet.routes'));
app.use('/api/tournaments', require('./routes/tournament.routes'));
app.use('/api/game',        require('./routes/game.routes').gameRouter);
app.use('/api/records',     require('./routes/records.routes'));
app.use('/api/friends',     require('./routes/friend.routes'));
app.use('/api/kyc',         require('./routes/kyc.routes'));
app.use('/api/clans',       require('./routes/clan.routes'));
app.use('/api/rooms',       require('./routes/room.routes'));

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ─── API 404 HANDLER ──────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ─── STATIC FRONTEND (Serves Next.js public directory with optimized chess pages) ────
app.use(express.static(path.join(__dirname, '../frontend_next/public')));

// Fallback to static chess login page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend_next/public/pages/login.html'));
});

module.exports = app;
