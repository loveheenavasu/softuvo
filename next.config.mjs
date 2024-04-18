/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      },
      experimental: {
        serverActions: {
          bodySizeLimit: '20mb',
        },
      },
};

export default nextConfig;
