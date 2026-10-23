require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app    = express();
const PORT   = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Intag API Server', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({ service: 'Intag API Server v1.0', endpoints: [
    'GET  /health',
    'GET  /api/webhooks/facebook   (verify)',
    'POST /api/webhooks/facebook   (events)',
    'GET  /api/auto-reply/status',
    'GET  /api/wallet/:userId',
  ]});
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/webhooks', require('./routes/webhook'));
app.use('/api/auto-reply', require('./routes/autoReply'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));

// ── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Intag API Server running on port ${PORT}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/webhooks/facebook  (verify)`);
  console.log(`   POST /api/webhooks/facebook  (events)`);
});
