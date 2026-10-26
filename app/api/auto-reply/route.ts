import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const rules = await prisma.autoReplyRule.findMany({
            where: user.role === 'ADMIN' ? {} : { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error("Failed to fetch auto-reply rules:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { wallet: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { pageId, postId, replyText, replyText2, replyText3, privateMessage, includeName, keywords, activeDays, updateOnly } = await req.json();

        if (!pageId || !postId || !replyText) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const parsedActiveDays = activeDays ? parseInt(activeDays, 10) : 30;

        // Validate if rule already exists for this post
        const existingRule = await prisma.autoReplyRule.findFirst({
            where: {
                userId: user.role === "ADMIN" ? undefined : user.id,
                postId: postId
            }
        });

        // Fast update without new billing (e.g. converting to AI or modifying text)
        if (existingRule && updateOnly) {
            const updatedRule = await prisma.autoReplyRule.update({
                where: { id: existingRule.id },
                data: {
                    replyText,
                    replyText2: replyText2 || null,
                    replyText3: replyText3 || null,
                    privateMessage: privateMessage || null,
                    includeName: Boolean(includeName),
                    keywords: keywords ? String(keywords).toLowerCase() : null,
                    isActive: true
                }
            });
            return NextResponse.json(updatedRule);
        }

        if (existingRule) {
            return NextResponse.json({ 
                error: "RULE_EXISTS", 
                message: "An auto-reply rule already exists for this post.",
                rule: existingRule
            }, { status: 409 });
        }

        // --- Upfront Subscription Billing Logic ---
        const sysConfig = await prisma.systemSetting.findFirst();
        let totalCost = 0;
        
        // Admins are exempt from billing; regular users pay if billing is enabled
        if (user.role !== "ADMIN" && sysConfig?.autoReplyEnabled) {
            const price = sysConfig.autoReplyPrice || 0;
            // Calculate cost: (Days / 30) * Price per 30 days
            totalCost = (parsedActiveDays / 30) * price;
        }

        const userWallet = user.wallet;
        const currentBalance = userWallet?.balance || 0;

        if (totalCost > 0) {
            if (!userWallet || currentBalance < totalCost) {
                return NextResponse.json({ 
                    error: "INSUFFICIENT_BALANCE",
                    message: `رصيد محفظتك غير كافٍ. التكلفة المطلوبة هي $${totalCost.toFixed(2)} بينما رصيدك الحالي هو $${currentBalance.toFixed(2)}. يرجى شحن المحفظة أولاً.`,
                    requiredAmount: totalCost,
                    currentBalance: currentBalance
                }, { status: 402 });
            }
        }

        // Perform creation and deduction in a transaction
        const resultRule = await prisma.$transaction(async (tx) => {
            const newRule = await tx.autoReplyRule.create({
                data: {
                    userId: user.id,
                    pageId,
                    postId,
                    replyText,
                    replyText2: replyText2 || null,
                    replyText3: replyText3 || null,
                    privateMessage: privateMessage || null,
                    includeName: Boolean(includeName),
                    keywords: keywords ? String(keywords).toLowerCase() : null,
                    isActive: true,
                    activeDays: parsedActiveDays
                }
            });

            if (totalCost > 0 && userWallet) {
                await tx.wallet.update({
                    where: { id: userWallet.id },
                    data: { balance: { decrement: totalCost } }
                });

                await tx.walletTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -totalCost,
                        type: "DEDUCTION",
                        description: `اشتراك الرد الآلي للمنشور (${parsedActiveDays} يوم) للمنشور ${postId}`
                    }
                });
            }

            return newRule;
        });

        return NextResponse.json(resultRule);
    } catch (error) {
        console.error("Failed to create auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
