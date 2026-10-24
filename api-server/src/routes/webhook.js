const express = require("express");
const router  = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── GET: Verify Webhook ─────────────────────────────────────────────────────
router.get("/facebook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || "intag_webhook_token";
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook Webhook verified!");
    return res.status(200).send(challenge);
  }
  console.warn("❌ Webhook verification failed. Got token:", token, "Expected:", VERIFY_TOKEN);
  return res.sendStatus(403);
});

// ── POST: Receive Facebook Events ──────────────────────────────────────────
router.post("/facebook", async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");

  const body = req.body;
  console.log("📩 Webhook event received:", JSON.stringify(body).substring(0, 300));

  if (body.object !== "page") return;

  for (const entry of body.entry || []) {
    const pageId = entry.id;

    // ── Handle feed changes (comments) ──────────────────────────────
    for (const change of entry.changes || []) {
      if (change.field !== "feed") continue;
      const value = change.value;
      if (value.item !== "comment" || value.verb !== "add") continue;

      const commentId  = value.comment_id;
      const postId     = value.post_id || "";
      const commenterName = value.from?.name || "";
      const commentText   = (value.message || "").toLowerCase().trim();

      console.log(`💬 Comment on page ${pageId}, post ${postId}, comment ${commentId}: "${commentText}"`);

      try {
        const page = await prisma.facebookPage.findUnique({
          where: { pageId },
          include: {
            user: {
              include: {
                autoReplyRules: {
                  where: { isActive: true, pageId }
                },
                pageAutoReplyRules: {
                  where: { isActive: true, pageId }
                }
              }
            }
          }
        });

        if (!page) { console.log("❌ Page not found:", pageId); continue; }
        if (!page.isAutoReplyActive) { console.log("⏸ Auto-reply disabled for page:", pageId); continue; }

        // Find matching rule: POST-level rules first (match by postId), then page-level
        let matchedRule = null;
        let ruleType = "PAGE";

        // Check post-specific rules
        for (const rule of page.user.autoReplyRules) {
          // Match by postId if specified
          const rulePostId = rule.postId || "";
          if (rulePostId && !postId.includes(rulePostId) && !postId.endsWith(rulePostId)) {
            console.log(`⏭ Rule ${rule.id} skipped: postId mismatch (rule: ${rulePostId}, event: ${postId})`);
            continue;
          }

          // Check keywords if specified
          if (rule.keywords) {
            const kws = rule.keywords.split(",").map(k => k.trim().toLowerCase());
            const matches = kws.some(kw => commentText.includes(kw));
            if (!matches) { console.log(`⏭ Rule ${rule.id} skipped: no keyword match`); continue; }
          }

          matchedRule = rule;
          ruleType = "POST";
          break;
        }

        // Fallback to page-level rules
        if (!matchedRule && page.user.pageAutoReplyRules.length > 0) {
          matchedRule = page.user.pageAutoReplyRules[0];
          ruleType = "PAGE";
        }

        if (!matchedRule) { console.log("⏭ No matching rule for this comment"); continue; }

        // Build reply text: pick random variant, replace [الاسم]/[name]
        let replyText;
        if (matchedRule.replyTexts && matchedRule.replyTexts.length > 0) {
          replyText = matchedRule.replyTexts[Math.floor(Math.random() * matchedRule.replyTexts.length)];
        } else {
          const variants = [matchedRule.replyText, matchedRule.replyText2, matchedRule.replyText3].filter(Boolean);
          replyText = variants[Math.floor(Math.random() * variants.length)];
        }

        // Replace [الاسم] or [name] with commenter name
        if (commenterName) {
          replyText = replyText.replace(/\[الاسم\]/g, commenterName).replace(/\[name\]/gi, commenterName);
        }

        // 1️⃣ Send public comment reply
        const fbCommentRes = await fetch(
          `https://graph.facebook.com/v21.0/${commentId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: replyText,
              access_token: page.pageAccessToken
            })
          }
        );
        const fbCommentResult = await fbCommentRes.json();
        const commentSuccess = fbCommentRes.ok && fbCommentResult.id;

        if (commentSuccess) {
          console.log(`✅ Public reply sent to comment ${commentId}: "${replyText}"`);
        } else {
          console.error(`❌ Failed to send public reply:`, JSON.stringify(fbCommentResult));
        }

        // 2️⃣ Send private message (DM) if configured
        const privateMsgTemplate = matchedRule.privateMessage;
        if (privateMsgTemplate && value.from?.id) {
          const senderId = value.from.id;
          let privateMsg = privateMsgTemplate;
          if (commenterName) {
            privateMsg = privateMsg.replace(/\[الاسم\]/g, commenterName).replace(/\[name\]/gi, commenterName);
          }

          const dmRes = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: privateMsg },
                messaging_type: "RESPONSE",
                access_token: page.pageAccessToken
              })
            }
          );
          const dmResult = await dmRes.json();
          if (dmRes.ok && dmResult.message_id) {
            console.log(`✅ Private message sent to ${senderId}`);
          } else {
            console.error(`❌ Failed to send DM:`, JSON.stringify(dmResult));
          }
        }

        // 3️⃣ Log the result
        await prisma.autoReplyLog.create({
          data: {
            userId: page.userId,
            pageId,
            postId: postId || null,
            commentId,
            ruleType,
            status: commentSuccess ? "SUCCESS" : "FAILED",
            errorMsg: commentSuccess ? null : JSON.stringify(fbCommentResult)
          }
        });

        // 4️⃣ Update rule stats
        if (commentSuccess) {
          const updateData = { repliesSentCount: { increment: 1 }, lastExecutedAt: new Date(), lastExecutionStatus: "SUCCESS" };
          if (ruleType === "POST") {
            await prisma.autoReplyRule.update({ where: { id: matchedRule.id }, data: updateData });
          } else {
            await prisma.pageAutoReplyRule.update({ where: { id: matchedRule.id }, data: updateData });
          }

          // 5️⃣ Deduct wallet balance
          const settings = await prisma.systemSetting.findFirst();
          const price = ruleType === "POST" ? (settings?.autoReplyPrice || 0) : (settings?.pageAutoReplyPrice || 0);
          if (price > 0) {
            const wallet = await prisma.wallet.findFirst({ where: { userId: page.userId } });
            if (wallet) {
              await prisma.$transaction([
                prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: price } } }),
                prisma.walletTransaction.create({
                  data: { amount: -price, type: "DEDUCTION", description: `Auto-reply to comment ${commentId}`, userId: page.userId }
                })
              ]);
            }
          }
        }
      } catch (err) {
        console.error("❌ Webhook processing error:", err.message, err.stack);
      }
    }

    // ── Handle messages ─────────────────────────────────────────────
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const messageText = messaging.message?.text;
      if (!senderId || !messageText) continue;
      console.log(`💬 Message from ${senderId}: "${messageText}"`);
      // Future: handle messaging auto-replies here
    }
  }
});

module.exports = router;