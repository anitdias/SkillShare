import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all remote images (use specific domains if needed)
      },
    ],
    domains: ["lh3.googleusercontent.com", "unsplash.com"], // Add domains as needed
  },
};

export default nextConfig;
