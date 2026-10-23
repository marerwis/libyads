const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/auto-reply/status — حالة كل قواعد الرد التلقائي
router.get('/status', async (req, res) => {
  try {
    const rules = await prisma.autoReplyRule.findMany({
      select: { id: true, pageId: true, isActive: true, repliesSentCount: true, lastExecutedAt: true }
    });
    const pageRules = await prisma.pageAutoReplyRule.findMany({
      select: { id: true, pageId: true, isActive: true, repliesSentCount: true }
    });
    res.json({ postRules: rules, pageRules });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auto-reply/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.autoReplyLog.findMany({
      orderBy: { createdAt: 'desc' }, take: 100
    });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
