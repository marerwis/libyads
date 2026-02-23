import { prisma } from "@/lib/prisma";

export const walletService = {
    /**
     * Check if a user has sufficient balance for a transaction
     */
    async checkBalance(userId: string, amount: number): Promise<boolean> {
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) return false;
        return wallet.balance >= amount;
    },

    /**
     * Deduct funds securely using a transaction
     */
    async deductFunds(userId: string, amount: number, reference: string = "CAMPAIGN_CREATION"): Promise<boolean> {
        try {
            await prisma.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUnique({
                    where: { userId },
                });

                if (!wallet || wallet.balance < amount) {
                    throw new Error("Insufficient balance");
                }

                // Deduct balance
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { decrement: amount } },
                });

                // Record transaction
                await tx.walletTransaction.create({
                    data: {
                        userId: userId,
                        amount: amount,
                        type: "DEDUCTION",
                    },
                });
            });

            return true;
        } catch (error) {
            console.error(`Failed to deduct funds for user ${userId}:`, error);
            return false;
        }
    },

    /**
     * Top-up a user's wallet (primarily used by admins)
     */
    async addFunds(userId: string, amount: number, reference: string = "Admin Deposit"): Promise<boolean> {
        try {
            await prisma.$transaction(async (tx) => {
                let wallet = await tx.wallet.findUnique({
                    where: { userId },
                });

                if (!wallet) {
                    // Create wallet if doesn't exist just in case
                    wallet = await tx.wallet.create({
                        data: {
                            userId,
                            balance: 0
                        }
                    });
                }

                // Add balance
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: amount } },
                });

                // Record transaction
                await tx.walletTransaction.create({
                    data: {
                        userId: userId,
                        amount: amount,
                        type: "DEPOSIT",
                        description: reference
                    },
                });
            });

            return true;
        } catch (error) {
            console.error(`Failed to add funds for user ${userId}:`, error);
            return false;
        }
    },

    /**
     * Refund wallet if a Meta API call fails
     */
    async refundWallet(userId: string, amount: number, reason: string): Promise<boolean> {
        try {
            await prisma.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUnique({
                    where: { userId },
                });

                if (!wallet) throw new Error("Wallet not found for refund");

                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: amount } },
                });

                await tx.walletTransaction.create({
                    data: {
                        userId: userId,
                        amount: amount,
                        type: "REFUND",
                        // In a real app we'd save the reason in a metadata field or description
                        description: reason,
                    },
                });
            });
            console.log(`Refunded $${amount} to user ${userId}. Reason: ${reason}`);
            return true;
        } catch (error) {
            console.error(`CRITICAL: Failed to refund user ${userId}:`, error);
            return false;
        }
    },
};
