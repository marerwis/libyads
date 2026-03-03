import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { amount } = await req.json()

    if (![10, 50, 100].includes(amount)) {
        return NextResponse.json({ error: "Invalid amount. Choose $10, $50, or $100." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { wallet: true }
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (!user.wallet) {
        await prisma.wallet.create({ data: { userId: user.id, balance: amount } })
    } else {
        await prisma.wallet.update({
            where: { id: user.wallet.id },
            data: { balance: { increment: amount } }
        })
    }

    await prisma.walletTransaction.create({
        data: {
            userId: user.id,
            amount,
            type: "TOPUP",
            description: `Top up $${amount}`
        }
    })

    return NextResponse.json({ success: true, topup: amount })
}
