import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { wallet: true }
    })

    return NextResponse.json({ balance: user?.wallet?.balance || 0 })
}
