"use client";

import { useEffect } from "react";
import { LicenseManager } from "ag-grid-enterprise";

// Set license key as early as possible (module level, before any grid mounts).
LicenseManager.setLicenseKey(process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY ?? "");

// Next.js 15 intercepts every console.error and shows a dev overlay, including
// AG Grid's asterisk-bordered license banner. Suppress that banner only — all
// real errors still go through.
if (process.env.NODE_ENV === "development") {
  const _orig = console.error;
  // eslint-disable-next-line no-console
  console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (/^\*+/.test(msg) || msg.toLowerCase().includes("license")) return;
    _orig.apply(console, args);
  };
}

const BootstrapJS = () => {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
};

export default BootstrapJS;
