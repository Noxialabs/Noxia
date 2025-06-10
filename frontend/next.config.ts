/* import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true, // if using app directory
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*", // Proxy to Backend
      },
    ];
  },
};

module.exports = nextConfig;
