import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    designation?: string | null;
    description?: string | null;
    role?: "admin" | "manager" | "user";
  }

  interface Session {
    user: User;  
  }

  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    designation?: string | null;
    description?: string | null;
    role?: "admin" | "manager" | "user";
  }
}