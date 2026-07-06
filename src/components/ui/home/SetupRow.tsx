"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Circle } from "react-feather";
import { CatalogTile } from "@/types/home";

type Props = {
  tile: CatalogTile;
  done: boolean;
  isNext: boolean;
  isLast: boolean;
  basePath: string;
  storeName: string;
};

const SetupRow = ({ tile, done, isNext, isLast, basePath, storeName }: Props) => {
  const href = tile.btnUrl === "#" || tile.comingSoon ? "#" : `${basePath}${tile.btnUrl}`;
  const para = tile.para.replace(/\[StoreName\]/g, storeName || "your store");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: isNext ? "#fafaff" : "#fff",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        borderLeft: isNext ? "3px solid #6366f1" : "3px solid transparent",
      }}
    >
      {/* Status icon */}
      <div style={{ flexShrink: 0 }}>
        {done ? (
          <CheckCircle size={18} style={{ color: "#16a34a" }} />
        ) : (
          <Circle size={18} style={{ color: "#cbd5e1" }} />
        )}
      </div>

      {/* Tile icon */}
      <div style={{ flexShrink: 0 }}>
        <Image
          src={tile.icon}
          width={32}
          height={32}
          alt={tile.title}
          unoptimized
          style={{ opacity: done ? 0.45 : 1 }}
        />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: done ? 500 : 600, color: done ? "#94a3b8" : "#1e293b" }}>
            {tile.title}
          </span>
          {done && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#16a34a",
              background: "#dcfce7", padding: "1px 7px", borderRadius: 20, letterSpacing: "0.03em",
            }}>
              Done
            </span>
          )}
          {tile.comingSoon && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#94a3b8",
              background: "#f1f5f9", padding: "1px 7px", borderRadius: 20,
            }}>
              Coming Soon
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {para}
        </div>
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0 }}>
        {tile.comingSoon ? null : done ? (
          <Link href={href} style={{ fontSize: 12, color: "#6366f1", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" }}>
            Manage →
          </Link>
        ) : (
          <Link
            href={href}
            className={isNext ? "btn btn-primary btn-sm rounded-pill" : "btn btn-outline-secondary btn-sm rounded-pill"}
            style={{ fontSize: 12, whiteSpace: "nowrap" }}
          >
            {tile.btnText}
          </Link>
        )}
      </div>
    </div>
  );
};

export default SetupRow;
