import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const nextConfig = (phase: string): NextConfig => {
  const isDevelopmentServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    distDir: isDevelopmentServer ? '.next-dev' : '.next',
    outputFileTracingRoot: process.cwd(),
    turbopack: {
      root: process.cwd(),
    },
  };
};

export default nextConfig;
