import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Transpile external monorepo packages
  transpilePackages: ['@about-experience'],
};

export default nextConfig;
