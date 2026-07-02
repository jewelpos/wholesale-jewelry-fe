import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_ORIGIN ?? "http://api.jewelpos.com:3129";

const nextConfig: NextConfig = {
  // AG Grid 32 ColGroupDef has a known bug with React 18 Strict Mode: during the fake
  // unmount/remount, ColumnGroup.providedColumnGroup is nulled and the fake remount
  // throws in HeaderGroupCellCtrl.setComp. Disable Strict Mode until AG Grid fixes it.
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "jewelposbucket.s3.amazonaws.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
