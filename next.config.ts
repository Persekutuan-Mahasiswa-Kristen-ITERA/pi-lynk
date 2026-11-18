import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // One switch for the form and the API: the home page is a client component,
  // so PUBLIC_CREATION_ENABLED (read by /api/links) is passed to it at build time.
  // Changing it needs a redeploy, like any env var on Vercel.
  env: {
    NEXT_PUBLIC_CREATION_ENABLED:
      process.env.PUBLIC_CREATION_ENABLED ?? process.env.NEXT_PUBLIC_CREATION_ENABLED ?? "true",
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
