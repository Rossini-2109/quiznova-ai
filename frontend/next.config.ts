import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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