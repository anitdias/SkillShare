import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
  
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
  
          if (!user) {
            return null;
          }
  
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
  
          if (!isValid) {
            return null;
          }
  
          return {
            id: user.id,
            email: user.email,
            name: user.username,
            image: user.profilePictureUrl
          };
        }
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!
      })
    ],
    session: {
      strategy: "jwt"
    },
    pages: {
      signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
              token.id = user.id;
            }
            return token;
          },
      // async signIn({ user, account }) {
      //   if (account.provider === 'google' || account.provider === 'microsoft') {
      //     const existingUser = await prisma.user.findUnique({
      //       where: { email: user.email }
      //     });
  
      //     if (!existingUser) {
      //       const username = `user_${Math.random().toString(36).substring(2, 10)}`;
      //       await prisma.user.create({
      //         data: {
      //           email: user.email,
      //           username,
      //           profilePictureUrl: user.image,
      //         },
      //       });
      //     }
      //   }
      //   return true;
      // },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub!;
        }
        return session;
      }
    }
  };
  
  const handler = NextAuth(authOptions);
  export { handler as GET, handler as POST };