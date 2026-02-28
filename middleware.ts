import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/facebook/:path*",
        "/api/campaigns/:path*",
        "/api/wallet/:path*",
        "/api/admin/:path*"
    ],
};
