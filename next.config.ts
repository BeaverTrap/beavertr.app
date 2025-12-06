import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Exclude puppeteer from serverless bundle to reduce size and avoid build issues
  serverExternalPackages: ['puppeteer'],
};

export default nextConfig;
