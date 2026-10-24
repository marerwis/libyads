require('dotenv').config();

// ── Auto-fix DATABASE_URL if pointing to wrong Supabase project ────────────
const CORRECT_HOST = 'aws-1-eu-central-1.pooler.supabase.com';
const CORRECT_PROJECT = 'octqkviwrjxvugcfbdhp';
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes(CORRECT_PROJECT)) {
  const pass = process.env.DB_PASS;
  if (pass) {
    process.env.DATABASE_URL = `postgresql://postgres.${CORRECT_PROJECT}:${pass}@${CORRECT_HOST}:6543/postgres?pgbouncer=true`;
    process.env.DIRECT_URL   = `postgresql://postgres.${CORRECT_PROJECT}:${pass}@${CORRECT_HOST}:5432/postgres`;
    console.log('⚠️  DATABASE_URL auto-corrected using DB_PASS env var');
  } else {
    console.error('❌ FATAL: DATABASE_URL is wrong and DB_PASS is not set!');
    console.error('   Set DB_PASS environment variable in Render dashboard');
  }
}

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Intag API Server', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({ service: 'Intag API Server v1.0', endpoints: [
    'GET  /health',
    'GET  /api/webhooks/facebook   (verify)',
    'POST /api/webhooks/facebook   (events)',
    'GET  /api/auto-reply/status',
  ]});
});

app.use('/api/webhooks',   require('./routes/webhook'));
app.use('/api/auto-reply', require('./routes/autoReply'));
app.use('/api/wallet',     require('./routes/wallet'));
app.use('/api/admin',      require('./routes/admin'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, async () => {
  console.log(`\n🚀 Intag API Server on port ${PORT}`);
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database: Connected to ' + CORRECT_PROJECT);
  } catch (e) {
    console.error('   ❌ Database FAILED:', e.message);
  }
});�───────────
app.use('/api/webhooks',  require('./routes/webhook'));
app.use('/api/auto-reply', require('./routes/autoReply'));
app.use('/api/wallet',    require('./routes/wallet'));
app.use('/api/admin',     require('./routes/admin'));

// ── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Intag API Server running on port ${PORT}`);
  console.log(`   DB Project: ${CORRECT_PROJECT}`);
  
  // اختبار اتصال قاعدة البيانات عند البدء
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database connection: OK');
  } catch (e) {
    console.error('   ❌ Database connection FAILED:', e.message);
  }
  
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/webhooks/facebook  (verify)`);
  console.log(`   POST /api/webhooks/facebook  (events)`);
});