import type { NextConfig } from "next";

const BACKEND_URL = "http://fmalresearch.railway.internal:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { domains: [] },
  async rewrites() {
    return [
      { source: "/api/health", destination: `${BACKEND_URL}/health` },
      { source: "/api/auth/:path*", destination: `${BACKEND_URL}/auth/:path*` },
      { source: "/api/research/:path*", destination: `${BACKEND_URL}/research/:path*` },
      { source: "/api/billing/:path*", destination: `${BACKEND_URL}/billing/:path*` },
      { source: "/api/ws/:path*", destination: `${BACKEND_URL}/ws/:path*` },
    ];
  },
};

export default nextConfig;
