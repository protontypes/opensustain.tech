import type { NextConfig } from "next";

// Empty on a real domain; "/opensustain.tech" on protontypes.github.io before
// one is attached. deploy.yml sets it; see lib/base-path.ts.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath,
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
