import type { NextConfig } from "next";

const BACKEND_URL = "http://fmalresearch.railway.internal:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { domains: [] },
  async rewrites() {
    return [
      { source: "/health", destination: `${BACKEND_URL}/health` },
      { source: "/auth/:path*", destination: `${BACKEND_URL}/auth/:path*` },
      { source: "/research/:path*", destination: `${BACKEND_URL}/research/:path*` },
      { source: "/ws/:path*", destination: `${BACKEND_URL}/ws/:path*` },
      { source: "/billing/:path*", destination: `${BACKEND_URL}/billing/:path*` },
    ];
  },
};

export default nextConfig;
