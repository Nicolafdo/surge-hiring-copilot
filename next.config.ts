import type { NextConfig } from "next";

const repo = "surge-hiring-copilot";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export", // build plain HTML/CSS/JS into /out
  basePath: isProd ? `/${repo}` : "", // Pages serves at /repo-name
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
