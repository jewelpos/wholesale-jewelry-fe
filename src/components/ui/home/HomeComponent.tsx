"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/hook";

const HomeComponent = () => {
  const user = useAppSelector((state) => state.user.data);
  const { storePrefix } = useParams<{ storePrefix: string }>();

  return (
    <div className="content d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
      <div className="text-center" style={{ maxWidth: 420 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 28,
          }}
        >
          🏪
        </div>
        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>
          Welcome{user?.name ? `, ${user.name}` : ""}!
        </h4>
        <p style={{ color: "var(--text-secondary, #64748b)", fontSize: 14, marginBottom: 24 }}>
          Set up your store to get started. Once your store is ready, you&apos;ll have access to your full dashboard.
        </p>
        <Link href={`/${storePrefix}/store/create`} className="btn btn-primary rounded-pill px-4">
          Create your store →
        </Link>
      </div>
    </div>
  );
};

export default HomeComponent;
