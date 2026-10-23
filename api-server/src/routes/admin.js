const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, wallets, logs] = await Promise.all([
      prisma.user.count(),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.autoReplyLog.count({ where: { status: 'SUCCESS' } })
    ]);
    res.json({ totalUsers: users, totalBalance: wallets._sum.balance, totalReplies: logs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, wallet: { select: { balance: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
