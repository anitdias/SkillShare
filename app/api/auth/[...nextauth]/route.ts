import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Ensure this file exports a valid authOptions

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; // Correctly export the route handlers
