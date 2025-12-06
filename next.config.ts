import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Exclude better-sqlite3 from serverless bundle
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore better-sqlite3 and drizzle-orm/better-sqlite3 during build
      // This prevents webpack/turbopack from trying to resolve these modules
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
        'drizzle-orm/better-sqlite3': 'commonjs drizzle-orm/better-sqlite3',
        'drizzle-orm/better-sqlite3/migrator': 'commonjs drizzle-orm/better-sqlite3/migrator',
      });
    }
    return config;
  },
};

export default nextConfig;
