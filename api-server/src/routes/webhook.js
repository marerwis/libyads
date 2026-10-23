const express = require("express");
const router  = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── GET: Verify Webhook (Facebook handshake) ───────────────────────────────
router.get("/facebook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || "intag_webhook_token";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook Webhook verified!");
    return res.status(200).send(challenge);
  }
  console.warn("❌ Webhook verification failed");
  return res.sendStatus(403);
});

// ── POST: Receive Facebook Events ─────────────────────────────────────────
router.post("/facebook", async (req, res) => {
  // رد فوري لـ Facebook (يجب أن يكون خلال ثانيتين)
  res.status(200).send("EVENT_RECEIVED");

  const body = req.body;
  if (body.object !== "page") return;

  for (const entry of body.entry || []) {
    const pageId = entry.id;
    for (const change of entry.changes || []) {
      if (change.field !== "feed") continue;
      const value = change.value;

      // معالجة التعليقات فقط
      if (value.item !== "comment" || value.verb !== "add") continue;

      const commentId = value.comment_id;
      const commentText = (value.message || "").toLowerCase().trim();

      try {
        // جلب الصفحة من قاعدة البيانات
        const page = await prisma.facebookPage.findUnique({
          where: { pageId },
          include: {
            user: {
              include: {
                wallet: true,
                autoReplyRules: { where: { isActive: true } },
                pageAutoReplyRules: { where: { isActive: true, pageId } },
              },
            },
          },
        });

        if (!page || !page.isAutoReplyActive) continue;

        const rules = [
          ...page.user.autoReplyRules,
          ...page.user.pageAutoReplyRules,
        ];
        if (rules.length === 0) continue;

        // اختر قاعدة مطابقة
        const rule = rules[0];
        const replyTexts = rule.replyTexts || [rule.replyText];
        const replyText = replyTexts[Math.floor(Math.random() * replyTexts.length)];

        // أرسل الرد
        const fbRes = await fetch(
          `https://graph.facebook.com/v21.0/${commentId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: replyText,
              access_token: page.pageAccessToken,
            }),
          }
        );

        const fbResult = await fbRes.json();
        const success  = fbRes.ok && fbResult.id;

        // سجّل النتيجة
        await prisma.autoReplyLog.create({
          data: {
            userId: page.userId,
            pageId,
            commentId,
            ruleType: "PAGE",
            status: success ? "SUCCESS" : "FAILED",
            errorMsg: success ? null : JSON.stringify(fbResult),
          },
        });

        if (success) {
          console.log(`✅ Auto-replied to comment ${commentId}`);
          // خصم الرصيد
          const settings = await prisma.systemSetting.findFirst();
          const price = settings?.autoReplyPrice || 0;
          if (price > 0 && page.user.wallet) {
            await prisma.$transaction([
              prisma.wallet.update({
                where: { id: page.user.wallet.id },
                data: { balance: { decrement: price } },
              }),
              prisma.walletTransaction.create({
                data: {
                  amount: -price,
                  type: "DEDUCTION",
                  description: `Auto-reply to comment ${commentId}`,
                  userId: page.userId,
                },
              }),
            ]);
          }
        }
      } catch (err) {
        console.error("Webhook processing error:", err.message);
      }
    }
  }
});

module.exports = router;
