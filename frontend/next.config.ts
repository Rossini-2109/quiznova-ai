import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    turbopack: {
      root: ".",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "quiznova-ai-grdq.onrender.com",
        pathname: "/qrcodes/**",
      },
    ],
  },
};

export default nextConfig;