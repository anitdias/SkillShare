import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
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

        const passwordHash = user.passwordHash ?? ""; // Provide a default empty string
        const isValid = await bcrypt.compare(credentials.password, passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
        
        // Fetch additional user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { designation: true, description: true, role: true }
        });
        
        if (dbUser) {
          token.designation = dbUser.designation;
          token.description = dbUser.description;
          token.role = dbUser.role;
        }
      }
      
      // Handle updates from session callback
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.designation = session.user.designation;
        token.description = session.user.description;
        token.role = session.user.role;
      }
      
      return token;
    },
    
    // In the session callback
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null | undefined;
        session.user.image = token.image as string | null | undefined;
        session.user.designation = token.designation as string | null | undefined;
        session.user.description = token.description as string | null | undefined;
        session.user.role = token.role as "admin" | "manager" | "user" | undefined;
      }
      return session;
    }
  }
};