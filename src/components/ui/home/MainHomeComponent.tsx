"use client";

import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/lib/store/hook";
import { useQuery } from "@apollo/client";
import { GET_STORE_CATEGORY_QUERY } from "@/lib/graphql/query/store";
import { GetStoreCategoryData } from "@/types/store";
import SetupRow from "./SetupRow";
import { catalogByStoreType, defaultCatalog } from "@/lib/utils/homeCatalogConfig";
import { CatalogTile } from "@/types/home";
import useDefaultRoute from "@/hooks/useDefaultRoute";

const MainHomeComponent = () => {
  const user = useAppSelector((state) => state.user.data);
  const store = useAppSelector((state) => state.store.data);

  const { data: categoryData } = useQuery<GetStoreCategoryData>(GET_STORE_CATEGORY_QUERY);

  const categoryName = categoryData?.getStoreCategory.find(
    (c) => c.id === store?.storecategoryid
  )?.name;

  const tiles: CatalogTile[] = catalogByStoreType[categoryName ?? ""] ?? defaultCatalog;
  const { basePath } = useDefaultRoute();
  const storeName = store?.storename ?? "";

  const getDone = (tile: CatalogTile) =>
    tile.setupFlag ? !!(store as unknown as Record<string, unknown>)?.[tile.setupFlag] : false;

  const requiredTiles = tiles.filter((t) => !t.optional);
  const optionalTiles = tiles.filter((t) => t.optional);

  const doneCount = requiredTiles.filter(getDone).length;
  const totalRequired = requiredTiles.length;
  const progressPct = totalRequired > 0 ? Math.round((doneCount / totalRequired) * 100) : 0;
  const allDone = doneCount === totalRequired;

  const firstIncompleteIdx = requiredTiles.findIndex((t) => !getDone(t));

  const greeting = user?.name ?? storeName ?? "there";

  return (
    <div className="content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h4 style={{ fontWeight: 700, margin: 0, fontSize: 20 }}>
            {allDone ? `You're all set, ${greeting}!` : `Welcome, ${greeting}`}
          </h4>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 0 }}>
            {allDone
              ? "Your store is fully configured. Head to the dashboard to start selling."
              : "Complete the steps below to get your store ready. You can skip anything and return via the sidebar anytime."}
          </p>
        </div>
        <Link
          href={`${basePath}/dashboard/admin`}
          className="btn btn-outline-secondary btn-sm rounded-pill"
          style={{ fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Go to Dashboard →
        </Link>
      </div>

      {/* Progress card */}
      <div style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "16px 20px",
        marginBottom: 28,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Setup progress</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {doneCount} of {totalRequired} steps complete
          </span>
        </div>
        <div style={{ background: "#e2e8f0", borderRadius: 999, height: 8, overflow: "hidden" }}>
          <div style={{
            width: `${progressPct}%`,
            height: "100%",
            background: allDone ? "#16a34a" : "#6366f1",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Required steps */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#94a3b8",
          letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Required Setup
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          {requiredTiles.map((tile, idx) => (
            <SetupRow
              key={tile.title}
              tile={tile}
              done={getDone(tile)}
              isNext={idx === firstIncompleteIdx}
              isLast={idx === requiredTiles.length - 1}
              basePath={basePath}
              storeName={storeName}
            />
          ))}
        </div>
      </div>

      {/* Optional */}
      {optionalTiles.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#94a3b8",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
          }}>
            Optional — Expand Your Business
          </div>
          <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 10, overflow: "hidden" }}>
            {optionalTiles.map((tile, idx) => (
              <SetupRow
                key={tile.title}
                tile={tile}
                done={false}
                isNext={false}
                isLast={idx === optionalTiles.length - 1}
                basePath={basePath}
                storeName={storeName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainHomeComponent;
