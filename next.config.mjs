/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next"
};

export default nextConfig;
