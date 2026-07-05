/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy ke Railway ditangani via src/app/api/v1/[...path]/route.ts
  output: "standalone",
};

module.exports = nextConfig;
