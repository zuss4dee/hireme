import type { NextConfig } from "next";

const config: NextConfig = {
  // Keep production builds out of the dev server's .next, otherwise running
  // `npm run build` while `next dev` is up corrupts its module map and every
  // page 500s with "__webpack_modules__[moduleId] is not a function".
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default config;
