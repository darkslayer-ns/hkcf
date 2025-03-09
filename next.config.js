/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media',
          outputPath: 'static/media',
          name: '[name].[ext]',
        },
      },
    });

    return config;
  },
  experimental: {
    serverActions: {
      enabled: true
    }
  }
};