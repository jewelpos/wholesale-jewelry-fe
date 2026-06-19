import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showConfirmationDialog } from "@/lib/utils/confirmationDialog";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { DELETE_PRODUCT_MUTATION } from "@/lib/graphql/mutations/products";
import { ProductListType } from "@/types/product";
import Link from "next/link";
import { Camera, Edit, Eye, Printer, Settings, Trash2, X } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { useAppDispatch } from "@/lib/store/hook";
import ProductAdjustmentModal from "./ProductAdjustmentModal";
import PrintLabelsModal from "../labels/PrintLabelsModal";
import { createPortal } from "react-dom";
import ProductDrawer from "../productView/ProductDrawer";

function parseFirstImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch { /* direct URL */ }
  return raw;
}

interface ProductActionsProps {
  data: ProductListType;
  onDeleteSuccess?: () => void;
  onAdjustmentSuccess?: () => void;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  data,
  onDeleteSuccess,
  onAdjustmentSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION);
  const { basePath } = useDefaultRoute();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);
  const [imgLightboxOpen, setImgLightboxOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { outletId: outletIdParam } = useParams();
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const imageUrl = parseFirstImageUrl(data.itemimagepath);

  useEffect(() => {
    if (!imgLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setImgLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgLightboxOpen]);

  useEffect(() => {
    if (!imgLightboxOpen) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [imgLightboxOpen]);

  useEffect(() => {
    const el = imgContainerRef.current;
    if (!el || !imgLightboxOpen) return;
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
  }, [imgLightboxOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setTranslate({
      x: dragStart.current.tx + (e.clientX - dragStart.current.x),
      y: dragStart.current.ty + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const result = await showConfirmationDialog({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      icon: "warning",
    });

    if (result.isConfirmed) {
      const deleteResult = await handleTryCatch(async () => {
        const { data: responseData } = await deleteProduct({
          variables: {
            itemid: data.itemid,
            storeid: parsedStoreId,
          },
        });

        if (responseData?.deleteProduct.success) {
          dispatch(
            showNotification({
              message: responseData.deleteProduct.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          // Trigger the callback to refresh data
          onDeleteSuccess?.();
        } else if (responseData?.deleteProduct.error) {
          dispatch(
            showNotification({
              message: responseData.deleteProduct.error,
              type: NOTIFICATION_TYPES.ERROR,
            })
          );
        }
        return true;
      });

      if (deleteResult.error) {
        dispatch(
          showNotification({
            message: deleteResult.error,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
      }
    }
  };

  const hasTransactions = !!(
    Number(data.qtypurchased    ?? 0) !== 0 ||
    Number(data.itemquantityinhand ?? 0) !== 0 ||
    Number(data.totalsoldqty    ?? 0) !== 0 ||
    Number(data.overall_qty     ?? 0) !== 0
  );

  const handleAdjustment = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
  };

  const handlePrintLabels = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsPrintLabelsOpen(true);
  };

  const handleAdjustmentModalSuccess = () => {
    setIsAdjustmentModalOpen(false);
    onAdjustmentSuccess?.();
  };

  return (
    <>
    <div className="action-table-data">
      <div className="edit-delete-action">
        <div className="input-block add-lists"></div>
        {/* Camera / image icon */}
        <a
          className="p-1 me-1"
          href="#"
          onClick={(e) => { e.preventDefault(); if (imageUrl) setImgLightboxOpen(true); }}
          title={imageUrl ? "View image" : "No image"}
          style={{ cursor: imageUrl ? "pointer" : "default" }}
        >
          <Camera size={14} style={{ color: imageUrl ? "#3b82f6" : "#cbd5e1" }} />
        </a>
        <a
          className="p-1 me-1"
          href="#"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDrawerOpen(true); }}
          title="Quick View"
        >
          <Eye size={14} />
        </a>
        <Link
          className="me-2 p-2"
          href={`${basePath}/products/${data.itemcode}/edit`}
          onClick={(e) => e.stopPropagation()}
          scroll={false}
          title="Edit"
        >
          <Edit className="feather-edit" />
        </Link>
        {hasTransactions ? (
          <span
            className="p-2 me-2"
            title="Item has transactions, can't be deleted"
            style={{ cursor: "not-allowed", opacity: 0.35, display: "inline-flex", alignItems: "center" }}
          >
            <Trash2 size={14} />
          </span>
        ) : (
          <Link
            className="confirm-text p-2 me-2"
            href="#"
            onClick={handleDelete}
            scroll={false}
            title="Delete"
          >
            <Trash2 size={14} />
          </Link>
        )}
        <Link
          className="p-2 p-2 me-2"
          href="#"
          onClick={handleAdjustment}
          scroll={false}
        >
          <Settings className="feather-view" />
        </Link>
        <Link
          className="p-2 me-2"
          href="#"
          onClick={handlePrintLabels}
          scroll={false}
          title="Print Labels"
        >
          <Printer size={14} />
        </Link>
      </div>
      <ProductAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={handleCloseAdjustmentModal}
        onSuccess={handleAdjustmentModalSuccess}
        productData={data}
      />
      {isPrintLabelsOpen && (
        <PrintLabelsModal
          product={data}
          onClose={() => setIsPrintLabelsOpen(false)}
        />
      )}
      {imgLightboxOpen && imageUrl && typeof window !== "undefined" &&
        createPortal(
          <div
            onClick={() => setImgLightboxOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.65)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                padding: 20,
                maxWidth: "90vw",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                position: "relative",
              }}
            >
              <button
                onClick={() => setImgLightboxOpen(false)}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "#f1f5f9", border: "none", borderRadius: 6,
                  width: 28, height: 28, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
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
                style={{
                  width: 480, height: 480,
                  overflow: "hidden",
                  borderRadius: 8,
                  cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
                  userSelect: "none",
                  position: "relative",
                }}
              >
                <img
                  src={imageUrl}
                  alt={data.itemdescription ?? "product"}
                  style={{
                    width: 480, height: 480,
                    objectFit: "contain",
                    display: "block",
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                    transformOrigin: "center center",
                    transition: dragging ? "none" : "transform 0.15s ease",
                    pointerEvents: "none",
                  }}
                />
                {scale > 1 && (
                  <div style={{
                    position: "absolute", bottom: 8, right: 8,
                    background: "rgba(0,0,0,0.5)", color: "#fff",
                    fontSize: 11, padding: "2px 6px", borderRadius: 4,
                    pointerEvents: "none",
                  }}>
                    {scale.toFixed(1)}×
                  </div>
                )}
              </div>
              {data.itemdescription && (
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", textAlign: "center" }}>
                  {data.itemdescription}
                </div>
              )}
              {data.itemcode && (
                <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
                  {data.itemcode}
                </div>
              )}
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                Scroll to zoom · Drag to pan · Double-click to reset
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
      {drawerOpen && (
        <ProductDrawer
          itemcode={data.itemcode ?? ""}
          storeId={parsedStoreId}
          outletId={parsedOutletId}
          onClose={() => setDrawerOpen(false)}
          mode="drawer"
        />
      )}
    </>
  );
};

export default ProductActions;
