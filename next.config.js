/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["ipfs.io", "gateway.pinata.cloud", "images.unsplash.com"],
    unoptimized: process.env.NODE_ENV === "development",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        util: require.resolve('util'),
        url: require.resolve('url'),
        assert: require.resolve('assert'),
      };
      
      // 添加全局变量的定义
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
      
      // 定义全局变量
      config.plugins.push(
        new webpack.DefinePlugin({
          global: 'globalThis',
        })
      );
    }
    
    // 忽略Node.js特定的依赖和有问题的WASM文件
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'socket.io-client': 'socket.io-client',
        'engine.io-client': 'engine.io-client'
      });
    }
    
    // 忽略有问题的WASM文件，让SDK在运行时动态加载
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    
    return config;
  },
  env: {
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  },
};

module.exports = nextConfig;