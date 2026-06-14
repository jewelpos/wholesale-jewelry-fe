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
  const imageUrl = parseFirstImageUrl(data.itemimagepath);

  useEffect(() => {
    if (!imgLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setImgLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgLightboxOpen]);

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
        <Link
          className="p-1 me-1"
          href={`${basePath}/products/${data.itemcode}/view`}
          onClick={(e) => e.stopPropagation()}
          scroll={false}
          title="View"
        >
          <Eye size={14} />
        </Link>
        <Link
          className="me-2 p-2"
          href={`${basePath}/products/${data.itemcode}/edit`}
          onClick={(e) => e.stopPropagation()}
          scroll={false}
          title="Edit"
        >
          <Edit className="feather-edit" />
        </Link>
        <Link
          className="confirm-text p-2 me-2"
          href="#"
          onClick={handleDelete}
          scroll={false}
        >
          <Trash2 className="feather-trash-2" />
        </Link>
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
              <img
                src={imageUrl}
                alt={data.itemdescription ?? "product"}
                style={{ width: 480, height: 480, objectFit: "contain", borderRadius: 8, display: "block" }}
              />
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
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
};

export default ProductActions;
