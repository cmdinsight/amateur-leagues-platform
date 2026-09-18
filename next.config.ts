import type { NextConfig } from "next";

// Server Actions default to a 1MB body limit, too small for a phone photo
// uploaded as a logo/escudo/foto. Raised close to Vercel's own ~4.5MB
// request-body ceiling for serverless functions (a platform limit that
// can't be configured away — very large raw photos can still fail there).
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
