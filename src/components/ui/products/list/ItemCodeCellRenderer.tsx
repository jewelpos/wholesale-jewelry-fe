"use client";

import React, { useEffect, useRef, useState } from "react";
import { ICellRendererParams } from "ag-grid-community";
import { Camera, Tag, Star, X } from "react-feather";
import { createPortal } from "react-dom";
import { ProductListType } from "@/types/product";

const NEW_DAYS = 30;

function parseFirstImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch { /* direct URL */ }
  return raw;
}

function isNewItem(createddate: string | number | null | undefined): boolean {
  if (!createddate) return false;
  const ts = Number(createddate);
  if (isNaN(ts)) return false;
  return Date.now() - ts < NEW_DAYS * 24 * 60 * 60 * 1000;
}

const ItemCodeCellRenderer = (params: ICellRendererParams<ProductListType>) => {
  const data = params.data;
  if (!data) return null;

  const imageUrl = parseFirstImageUrl(data.itemimagepath);
  const isNew = isNewItem(data.createddate);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  // Reset zoom/pan only when lightbox transitions true→false (closing), not on every mount
  useEffect(() => {
    if (prevOpenRef.current && !lightboxOpen) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
    prevOpenRef.current = lightboxOpen;
  }, [lightboxOpen]);

  useEffect(() => {
    const el = imgContainerRef.current;
    if (!el || !lightboxOpen) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setScale(prev => {
        const next = Math.min(Math.max(prev * factor, 1), 4);
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [lightboxOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setTranslate({ x: dragStart.current.tx + (e.clientX - dragStart.current.x), y: dragStart.current.ty + (e.clientY - dragStart.current.y) });
  };
  const handleMouseUp = () => setDragging(false);

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", gap: 4 }}>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
        {data.itemcode}
      </span>

      {isNew && (
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
          color: "#fff", background: "#22c55e",
          borderRadius: 3, padding: "1px 4px", lineHeight: "14px",
          flexShrink: 0, textTransform: "uppercase",
        }}>
          NEW
        </span>
      )}

      {!!data.hasbulkdiscount && (
        <span title="Bulk discount available" style={{ display: "flex", flexShrink: 0 }}>
          <Tag size={11} style={{ color: "#2563eb" }} />
        </span>
      )}
      {!!data.haspromotion && (
        <span title="Active promotion" style={{ display: "flex", flexShrink: 0 }}>
          <Star size={11} style={{ color: "#d97706" }} />
        </span>
      )}

      <a
        href="#"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (imageUrl) setLightboxOpen(true); }}
        title={imageUrl ? "View image" : "No image"}
        style={{ cursor: imageUrl ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center" }}
      >
        <Camera size={13} style={{ color: imageUrl ? "#3b82f6" : "#cbd5e1" }} />
      </a>

      {lightboxOpen && imageUrl && typeof window !== "undefined" &&
        createPortal(
          <div
            onClick={() => setLightboxOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", padding: 20, maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative" }}
            >
              <button
                onClick={() => setLightboxOpen(false)}
                style={{ position: "absolute", top: 10, right: 10, background: "#f1f5f9", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={14} color="#64748b" />
              </button>
              <div
                ref={imgContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={() => { setScale(1); setTranslate({ x: 0, y: 0 }); }}
                style={{ width: 480, height: 480, overflow: "hidden", borderRadius: 8, cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default", userSelect: "none", position: "relative" }}
              >
                <img
                  src={imageUrl}
                  alt={data.itemdescription ?? "product"}
                  style={{ width: 480, height: 480, objectFit: "contain", display: "block", transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transformOrigin: "center center", transition: dragging ? "none" : "transform 0.15s ease", pointerEvents: "none" }}
                />
                {scale > 1 && (
                  <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 11, padding: "2px 6px", borderRadius: 4, pointerEvents: "none" }}>
                    {scale.toFixed(1)}×
                  </div>
                )}
              </div>
              {data.itemdescription && (
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", textAlign: "center" }}>{data.itemdescription}</div>
              )}
              {data.itemcode && (
                <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>{data.itemcode}</div>
              )}
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Scroll to zoom · Drag to pan · Double-click to reset</div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
};

export default ItemCodeCellRenderer;
