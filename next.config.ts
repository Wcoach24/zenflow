import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable SSR for canvas-heavy app
  experimental: {},
};

export default nextConfig;