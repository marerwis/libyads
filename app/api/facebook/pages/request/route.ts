import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pageId, pageName, pageAccessToken } = body;

    if (!pageId || !pageName || !pageAccessToken) {
      return NextResponse.json(
        { error: "Missing required fields: pageId, pageName, pageAccessToken" },
        { status: 400 },
      );
    }

    // Fetch global Meta settings for Libya Ads Business Manager credentials
    const metaSettings = await prisma.metaSetting.findFirst();

    if (
      !metaSettings ||
      !metaSettings.businessId ||
      !metaSettings.systemUserToken
    ) {
      return NextResponse.json(
        {
          error:
            "System Configuration Error: Libya Ads Business Manager credentials not set in Admin settings.",
        },
        { status: 500 },
      );
    }

    const { businessId, systemUserToken } = metaSettings;

    // Upsert the page in our database as PENDING
    const pageRecord = await prisma.facebookPage.upsert({
      where: { pageId: pageId },
      update: {
        pageName,
        pageAccessToken,
        status: "PENDING", // Initial state
      },
      create: {
        pageId,
        pageName,
        pageAccessToken,
        status: "PENDING",
        userId: session.user.id,
      },
    });

    // Send Request to Facebook Graph API
    const formData = new URLSearchParams();
    formData.append("page_id", pageId);
    formData.append("permitted_tasks", "['ADVERTISE', 'MANAGE', 'ANALYZE']");
    formData.append("access_token", systemUserToken);

    const fbResponse = await fetch(
      `https://graph.facebook.com/v19.0/${businessId}/client_pages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      },
    );

    const fbData = await fbResponse.json();

    if (fbData.error) {
      console.error(
        "Facebook API Error during client_pages request:",
        fbData.error,
      );

      const errorMessage = fbData.error.message || "";

      // If the page is already connected to the Business Manager, treat it as a success
      if (errorMessage.includes("Asset already belongs to this Business Manager")) {
        const activePage = await prisma.facebookPage.update({
          where: { pageId },
          data: { status: "ACTIVE" },
        });

        return NextResponse.json({
          success: true,
          message: "Page is already connected to the Business Manager.",
          page: activePage,
          fbResponse: fbData,
        });
      }

      // Revert status to REJECTED or FAILED for other errors
      await prisma.facebookPage.update({
        where: { pageId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json(
        {
          error:
            errorMessage || "Failed to send request via Facebook API.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Request sent successfully to the Facebook Page admin.",
      page: pageRecord,
      fbResponse: fbData,
    });
  } catch (error) {
    console.error("Failed to send Business Manager page request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
