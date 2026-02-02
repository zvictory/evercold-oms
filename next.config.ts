import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  experimental: {
    // Reduce overhead in development by optimizing heavy package imports
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Explicitly set Turbopack workspace root to silence multiple lockfiles warning
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
