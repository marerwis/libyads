import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: "facebook"
            }
        });

        if (!account || !account.access_token) {
            return NextResponse.json({ error: "No Facebook account linked" }, { status: 400 });
        }

        const fbResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${account.access_token}`);
        const fbData = await fbResponse.json();

        if (fbData.error) {
            return NextResponse.json({ error: fbData.error.message }, { status: 400 });
        }

        return NextResponse.json(fbData.data);
    } catch (error) {
        console.error("Failed to fetch Facebook pages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
