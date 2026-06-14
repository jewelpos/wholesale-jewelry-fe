"use client";

import React from "react";
import { useAppSelector } from "@/lib/store/hook";
import { useQuery } from "@apollo/client";
import { GET_STORE_CATEGORY_QUERY } from "@/lib/graphql/query/store";
import { GetStoreCategoryData } from "@/types/store";
import HomeCatalogTiles from "./HomeCatalogTiles";
import { catalogByStoreType, defaultCatalog } from "@/lib/utils/homeCatalogConfig";
import { CatalogTile } from "@/types/home";
import { Store } from "@/types/store";

const MainHomeComponent = () => {
  const user = useAppSelector((state) => state.user.data);
  const store = useAppSelector((state) => state.store.data);

  const { data: categoryData } = useQuery<GetStoreCategoryData>(GET_STORE_CATEGORY_QUERY);

  const categoryName = categoryData?.getStoreCategory.find(
    (c) => c.id === store?.storecategoryid
  )?.name;

  const tiles: CatalogTile[] = catalogByStoreType[categoryName ?? ""] ?? defaultCatalog;

  const outletNames = store?.outlets?.map((o) => o.outletname).join(" · ");

  return (
    <div className="content">
      {/* Store context banner */}
      <div
        style={{
          background: "var(--surface-muted, #f8fafc)",
          border: "1px solid var(--border-subtle, #e2e8f0)",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            {store?.storename ?? `Hi ${user?.name},`}
          </span>
          <span
            style={{
              background: "#dcfce7",
              color: "#16a34a",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            Store Ready ✓
          </span>
          {categoryName && (
            <span style={{ color: "var(--text-secondary, #64748b)", fontSize: 12 }}>
              {categoryName}
            </span>
          )}
        </div>
        {outletNames && (
          <div style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", marginTop: 4 }}>
            Current branches: {outletNames}
          </div>
        )}
        <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginTop: 6, marginBottom: 0 }}>
          Here&apos;s how to get set up — skip anything and come back via the sidebar anytime.
        </p>
      </div>

      {/* Required tiles */}
      <div className="row">
        {tiles
          .filter((t) => !t.optional)
          .map((tile) => (
            <HomeCatalogTiles
              key={tile.title}
              catalog={tile}
              storeName={store?.storename ?? ""}
              done={tile.setupFlag ? !!(store as unknown as Record<string, unknown>)?.[tile.setupFlag] : false}
            />
          ))}
      </div>

      {/* Optional expansion section */}
      {tiles.some((t) => t.optional) && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "8px 0 16px",
            }}
          >
            <hr style={{ flex: 1, margin: 0, borderColor: "var(--border-subtle, #e2e8f0)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-secondary, #94a3b8)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
              }}
            >
              Expand your business
            </span>
            <hr style={{ flex: 1, margin: 0, borderColor: "var(--border-subtle, #e2e8f0)" }} />
          </div>
          <div className="row">
            {tiles
              .filter((t) => t.optional)
              .map((tile) => (
                <HomeCatalogTiles
                  key={tile.title}
                  catalog={tile}
                  storeName={store?.storename ?? ""}
                  done={false}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MainHomeComponent;
