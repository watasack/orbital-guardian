/** @type {import('next').NextConfig} */
const nextConfig = {
  // ビルド時のエラーを無視（Vercelデプロイ用）
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // React Three Fiber用の設定
  transpilePackages: ['three'],
  
  // 画像最適化設定
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eoimages.gsfc.nasa.gov',
        pathname: '/images/**',
      },
    ],
  },
  
  // 実験的機能
  experimental: {
    // Web Worker サポート
    // workerThreads: true,
  },
  
  // webpack設定
  webpack: (config, { isServer }) => {
    // GLSLシェーダーファイルのサポート
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    });
    
    // クライアントサイドでNode.js組み込みモジュールを無効化
    // javascript-lp-solver がNode.jsモジュールを使おうとするため
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        child_process: false,
        os: false,
        net: false,
        tls: false,
        dns: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
