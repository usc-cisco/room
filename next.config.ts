import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon and must not be bundled.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
