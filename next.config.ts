import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.zid.store',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      }
    ],
  },
};

export default nextConfig;
