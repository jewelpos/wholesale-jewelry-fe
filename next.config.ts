import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AG Grid 32 ColGroupDef has a known bug with React 18 Strict Mode: during the fake
  // unmount/remount, ColumnGroup.providedColumnGroup is nulled and the fake remount
  // throws in HeaderGroupCellCtrl.setComp. Disable Strict Mode until AG Grid fixes it.
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=self, microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      ...(process.env.NODE_ENV !== "production"
        ? [{ protocol: "http" as const, hostname: "localhost" }]
        : []),
      {
        protocol: "https",
        hostname: "jewelposbucket.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
