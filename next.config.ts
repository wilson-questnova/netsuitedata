import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false
    };
    
    // Use IgnorePlugin to completely ignore optional TypeORM dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(react-native-sqlite-storage|@sap\/hana-client|mysql|oracledb|pg-native|sqlite3|better-sqlite3|ioredis|redis|typeorm-aurora-data-api-driver|pg-query-stream|sql\.js|mongodb)$/
      })
    );
    
    // Also ignore specific paths that might cause issues
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@sap\/hana-client\/extension\/Stream$/
      })
    );
    
    return config;
  }
};

export default nextConfig;
