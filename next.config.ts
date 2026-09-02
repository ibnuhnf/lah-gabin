import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Skip TypeScript build errors on deployment — typecheck runs in CI/tests
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
