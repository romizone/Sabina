import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  poweredByHeader: false,
  allowedDevOrigins: ["sabina.rominur.com"],
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;
