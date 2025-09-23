import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase the size limits for large JSON files
  serverExternalPackages: ['minisearch'],

  webpack: (config: any) => {
    // Configure WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle SQLite WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },

};

export default nextConfig;
