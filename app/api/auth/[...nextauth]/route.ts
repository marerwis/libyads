import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role?: string
        } & DefaultSession["user"]
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "m@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.password) return null;

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (isPasswordValid) {
                    return { id: user.id, name: user.name, email: user.email }
                }

                return null
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            if (!token.role && token.email) {
                const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
                if (dbUser) token.role = dbUser.role;
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    },
    events: {
        async createUser({ user }) {
            // Automatically create a wallet for newly registered OAuth users (like Google)
            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: 0.0,
                },
            });
        }
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }
