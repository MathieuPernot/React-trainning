import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const JavaScriptObfuscator = require('javascript-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack(config, { isServer }) {
    const isProd = process.env.NODE_ENV === 'production';

    // Appliquer l'obfuscation uniquement sur le client et en production
    if (isProd && !isServer) {
      config.module.rules.push({
        enforce: 'post',
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('javascript-obfuscator'),
          options: {
            compact: true,
            controlFlowFlattening: true,
            rotateStringArray: true,
            stringArray: true,
            stringArrayEncoding: ['rc4'],
            stringArrayThreshold: 0.75,
          },
        },
      });
    }

    return config;
  },
};

export default nextConfig;
