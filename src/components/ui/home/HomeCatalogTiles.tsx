"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "react-feather";
import { CatalogTile } from "@/types/home";
import useDefaultRoute from "@/hooks/useDefaultRoute";

type Props = {
  catalog: CatalogTile;
  storeName: string;
  done: boolean;
};

const HomeCatalogTiles = ({ catalog, storeName, done }: Props) => {
  const { basePath } = useDefaultRoute();

  const href = catalog.btnUrl === "#" || catalog.comingSoon
    ? "#"
    : `${basePath}${catalog.btnUrl}`;

  const para = catalog.para.replace(/\[StoreName\]/g, storeName || "your store");

  return (
    <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-6 d-flex">
      <div
        className="connected-app-card d-flex w-100"
        style={{
          opacity: catalog.comingSoon ? 0.6 : 1,
          border: catalog.optional ? "1.5px dashed var(--border-subtle, #cbd5e1)" : undefined,
          position: "relative",
        }}
      >
        {/* Done badge */}
        {done && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#dcfce7",
              color: "#16a34a",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            <CheckCircle size={11} />
            Done
          </span>
        )}

        {/* Coming soon badge */}
        {catalog.comingSoon && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "#f1f5f9",
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            Coming Soon
          </span>
        )}

        <ul className="w-100">
          <li className="flex-column align-items-start">
            <div className="d-flex align-items-center w-100">
              <div className="security-type d-flex align-items-center">
                <span className="system-app-icon">
                  <Image
                    src={catalog.icon}
                    height={40}
                    width={40}
                    alt={catalog.title}
                    unoptimized
                  />
                </span>
                <div className="security-title">
                  <h6 className="lead">
                    <b>{catalog.title}</b>
                  </h6>
                </div>
              </div>
            </div>
            <br />
            <p className="lead">{para}</p>
          </li>
          <li>
            <div className="integration-btn">
              {catalog.comingSoon ? (
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 16px",
                    borderRadius: 20,
                    fontSize: 13,
                    background: "#f1f5f9",
                    color: "#94a3b8",
                    fontWeight: 500,
                  }}
                >
                  Coming Soon
                </span>
              ) : (
                <Link
                  href={href}
                  className="btn btn-outline-primary rounded-pill"
                >
                  {done ? "Manage →" : catalog.btnText}
                </Link>
              )}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HomeCatalogTiles;
