// user-app/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(), // This sets the root to user-app/
  },
};

export default nextConfig;