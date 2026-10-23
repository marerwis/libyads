const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/wallet/:userId
router.get('/:userId', async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.params.userId },
      include: { user: { select: { name: true, email: true } } }
    });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json(wallet);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/wallet/:userId/transactions
router.get('/:userId/transactions', async (req, res) => {
  try {
    const txns = await prisma.walletTransaction.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }, take: 50
    });
    res.json(txns);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
