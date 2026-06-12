import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5201",
        pathname: "/qrcodes/**",
      },
    ],
  },
};

export default nextConfig;