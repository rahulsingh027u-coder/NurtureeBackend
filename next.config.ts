import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // disabled for dev stability
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "*.space-z.ai",
  ],
};

export default nextConfig;
