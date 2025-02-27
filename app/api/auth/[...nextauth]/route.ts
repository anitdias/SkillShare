import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Ensure this file exports a valid authOptions

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; // Correctly export the route handlers
