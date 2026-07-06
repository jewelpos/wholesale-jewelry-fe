"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldOff } from "react-feather";

const UnauthorizedPage = () => {
  const searchParams = useSearchParams();
  const prefix = searchParams.get("prefix") || "jw";
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <ShieldOff size={28} color="#ef4444" />
      </div>
      <h2 style={{ fontWeight: 700, fontSize: 24, color: "#1e293b", marginBottom: 8 }}>
        Access Denied
      </h2>
      <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, textAlign: "center", maxWidth: 380 }}>
        You don&apos;t have permission to perform that action. If you believe this is a mistake, contact your system administrator.
      </p>
      <Link
        href={`/${prefix}/login`}
        style={{
          padding: "10px 24px",
          background: "#376fd0",
          color: "#fff",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        Back to Login
      </Link>
    </div>
  );
};

export default UnauthorizedPage;