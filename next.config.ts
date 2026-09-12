import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // opensustain.tech ships as a fully static site (no API routes, no
  // server-only rendering): every route is pre-rendered at build time and
  // served as plain files, wherever that ends up being hosted.
  output: "export",
  // Static hosts serve directories via their index.html, so every route
  // needs a trailing slash to resolve without a redirect hop.
  trailingSlash: true,
  images: {
    // next/image's optimizer is a server feature; it has no server to call
    // under `output: "export"`, so images are served as-is.
    unoptimized: true,
  },
};

export default nextConfig;
