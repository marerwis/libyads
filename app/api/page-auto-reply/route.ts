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

        const rules = await prisma.pageAutoReplyRule.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error("Failed to fetch page auto-reply rules:", error);
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
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { pageId, replyTexts, privateMessage, includeName, activeDays } = await req.json();

        if (!pageId || !replyTexts || !Array.isArray(replyTexts) || replyTexts.length === 0) {
            return NextResponse.json({ error: "Missing required fields or empty replies" }, { status: 400 });
        }

        // Validate if rule already exists for this page
        const existingRule = await prisma.pageAutoReplyRule.findFirst({
            where: {
                userId: user.id,
                pageId: pageId
            }
        });

        if (existingRule) {
            return NextResponse.json({ error: "An auto-reply rule already exists for this page. Please edit or delete it." }, { status: 400 });
        }

        // Filter out empty replies
        const validReplies = replyTexts.filter(text => text.trim().length > 0);
        
        if(validReplies.length === 0) {
             return NextResponse.json({ error: "You must provide at least one valid reply text." }, { status: 400 });
        }

        const parsedActiveDays = activeDays ? parseInt(activeDays, 10) : 30;

        // --- Upfront Subscription Billing Logic ---
        const sysConfig = await prisma.systemSetting.findFirst();
        let totalCost = 0;
        
        if (sysConfig?.autoReplyEnabled) {
            const price = sysConfig.pageAutoReplyPrice || 0;
            // Calculate cost: (Days / 30) * Price per 30 days
            totalCost = (parsedActiveDays / 30) * price;
        }

        const userWallet = await prisma.wallet.findUnique({
            where: { userId: user.id }
        });

        if (totalCost > 0) {
            if (!userWallet || userWallet.balance < totalCost) {
                return NextResponse.json({ 
                    error: `Insufficient balance. This configuration requires $${totalCost.toFixed(2)}.` 
                }, { status: 402 });
            }
        }

        // Perform creation and deduction in a transaction
        const newRule = await prisma.$transaction(async (tx) => {
            const rule = await tx.pageAutoReplyRule.create({
                data: {
                    userId: user.id,
                    pageId,
                    replyTexts: validReplies,
                    privateMessage: privateMessage || null,
                    includeName,
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
                        description: `Upfront payment for Page-Level Auto-Reply (${parsedActiveDays} days) for page ${pageId}`
                    }
                });
            }

            return rule;
        });

        return NextResponse.json(newRule);
    } catch (error) {
        console.error("Failed to create page auto-reply rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
