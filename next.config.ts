import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Exclude better-sqlite3 from serverless bundle
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
