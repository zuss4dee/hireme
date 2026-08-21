import type { NextConfig } from "next";

const config: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default config;
