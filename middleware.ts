import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        // Redirect unauthenticated users to the home page
        signIn: "/",
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/facebook/:path*",
        "/api/campaigns/:path*",
        "/api/wallet/:path*",
        "/api/admin/:path*",
        "/api/auto-reply/:path*",
    ],
};