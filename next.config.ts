import type { NextConfig } from "next";

const uploadBodyLimit = "12mb";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: uploadBodyLimit,
    },
    // Next 15.5+ clones admin API bodies through middleware/proxy and silently
    // truncates anything over the default 1MB, so product photo uploads no-op.
    middlewareClientMaxBodySize: uploadBodyLimit,
    proxyClientMaxBodySize: uploadBodyLimit,
  } as NextConfig["experimental"],
};

export default nextConfig;
