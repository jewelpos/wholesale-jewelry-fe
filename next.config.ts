import type { NextConfig } from "next";

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
};

export default nextConfig;
