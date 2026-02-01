/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ORDER_SUBMISSION_URL: process.env.ORDER_SUBMISSION_URL
  }
};

module.exports = nextConfig;
