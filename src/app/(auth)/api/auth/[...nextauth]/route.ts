import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    // Prisma Adapter ko NextAuth se jodd rahe hain
    adapter: PrismaAdapter(prisma),

    // Authentication providers list
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],

    // JWT aur session management ki settings
    session: {
        strategy: "jwt",
    },

    // Custom JWT callback taaki hume session me user id bhi mile
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // TypeScript trick: session me id add karna
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },

    // Development debugging ke liye pages customize kar sakte ho
    pages: {
        // login: "/auth/signin" // Baad mein custom page banayenge

    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };