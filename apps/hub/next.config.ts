import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@viral/devin-client"],
  serverExternalPackages: ["@prisma/client"],
};
export default nextConfig;
