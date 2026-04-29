/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nuevoliberalismo.org',
      },
    ],
  },
}

export default nextConfig
