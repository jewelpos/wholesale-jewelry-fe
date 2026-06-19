"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@apollo/client";
import { X, Edit, Printer, Package, ArrowLeft } from "react-feather";
import { useRouter } from "next/navigation";
import {
  GET_PRODUCT_BY_ITEMCODE_QUERY,
  GET_ITEM_CATEGORIES_QUERY,
  GET_ITEM_SUBCATEGORIES_QUERY,
  GET_PRODUCT_LIST_QUERY,
} from "@/lib/graphql/query/products";
import { useUserRole } from "@/hooks/useUserRole";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import PrintLabelsModal from "../labels/PrintLabelsModal";

function parseFirstImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {}
  return raw;
}

function fmt(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      color: "#94a3b8",
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <div style={{ display: "flex", paddingBottom: 9, alignItems: "flex-start" }}>
      <span
        style={{
          fontSize: 12,
          color: "#94a3b8",
          minWidth: 110,
          flexShrink: 0,
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "#0f172a",
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  );
};

const StatBox = ({
  label,
  value,
  valueColor,
  borderRight,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  borderRight?: boolean;
}) => (
  <div
    style={{
      flex: 1,
      padding: "12px 14px",
      borderRight: borderRight ? "1px solid #e2e8f0" : undefined,
      minWidth: 90,
    }}
  >
    <div
      style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        color: "#94a3b8",
        marginBottom: 5,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 700,
        color: valueColor || "#0f172a",
        letterSpacing: "-0.3px",
      }}
    >
      {value}
    </div>
  </div>
);

export interface ProductDrawerProps {
  itemcode: string;
  storeId: number;
  outletId: number;
  onClose: () => void;
  mode?: "drawer" | "page";
}

const ProductDrawer: React.FC<ProductDrawerProps> = ({
  itemcode,
  storeId,
  outletId,
  onClose,
  mode = "drawer",
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const { basePath } = useDefaultRoute();
  const router = useRouter();
  const { isAtLeastManager } = useUserRole();

  useEffect(() => {
    setMounted(true);
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (mode === "drawer") {
      setVisible(false);
      setTimeout(onClose, 270);
    } else {
      onClose();
    }
  };

  const { data: productData, loading } = useQuery(GET_PRODUCT_BY_ITEMCODE_QUERY, {
    variables: { itemcode, storeid: storeId },
    skip: !itemcode || !storeId,
  });

  const { data: catData } = useQuery(GET_ITEM_CATEGORIES_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const product = productData?.getProductByItemCode;

  const { data: subcatData } = useQuery(GET_ITEM_SUBCATEGORIES_QUERY, {
    variables: { storeid: storeId, categoryid: product?.itemcategoryid },
    skip: !storeId || !product?.itemcategoryid,
  });

  const { data: listData } = useQuery(GET_PRODUCT_LIST_QUERY, {
    variables: {
      outletid: outletId,
      page: 1,
      perpage: 1,
      filters: [
        {
          key: "itemcode",
          value: { filterType: "text", type: "equals", filter: itemcode },
        },
      ],
      sortModel: [],
      rowGroupCols: [],
      groupKeys: [],
    },
    skip: !outletId || !itemcode,
  });

  const listProduct = listData?.getProductListNew?.data?.[0];

  const categoryName = useMemo(() => {
    if (!catData?.getItemCategories || !product?.itemcategoryid) return null;
    return (
      catData.getItemCategories.find(
        (c: any) => c.categoryid === product.itemcategoryid
      )?.categoryname ?? null
    );
  }, [catData, product]);

  const subcategoryName = useMemo(() => {
    if (!subcatData?.getItemSubcategories || !product?.subcategoryid)
      return null;
    return (
      subcatData.getItemSubcategories.find(
        (s: any) => s.subcategoryid === product.subcategoryid
      )?.subcategoryname ?? null
    );
  }, [subcatData, product]);

  const imageUrl = useMemo(
    () => parseFirstImageUrl(product?.itemimagepath),
    [product]
  );

  const tags = useMemo(() => {
    if (!product) return [];
    return [
      product.tag1, product.tag2, product.tag3, product.tag4, product.tag5,
      product.tag6, product.tag7, product.tag8, product.tag9, product.tag10,
    ].filter((t) => t && t !== "0");
  }, [product]);

  const hasDiamond = useMemo(() => {
    if (!product) return false;
    return [
      product.dshape, product.dlab, product.dcerno,
      product.dcarat, product.dcolor, product.dclarity,
    ].some(Boolean);
  }, [product]);

  const availableQty =
    listProduct?.availableqty !== undefined ? listProduct.availableqty : null;
  const reorderPt = product?.itemreorderqtypnt;
  const availColor =
    availableQty === null
      ? "#0f172a"
      : availableQty <= 0
      ? "#b91c1c"
      : reorderPt && availableQty <= reorderPt
      ? "#b45309"
      : "#15803d";

  const categoryPath = [categoryName, subcategoryName].filter(Boolean).join(" › ");
  const isActive = product?.itemstatus === "Active";

  const badge = (bg: string, color: string, text: string) => (
    <span
      style={{
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 20,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {text}
    </span>
  );

  const profitPct = useMemo(() => {
    if (!product || !isAtLeastManager) return null;
    const tag = parseFloat(product.itemtagprice as any);
    const cost = parseFloat(product.itempurchaseprice as any);
    if (!cost || isNaN(cost) || isNaN(tag)) return null;
    return Math.round(((tag - cost) / cost) * 100);
  }, [product, isAtLeastManager]);

  type StatEntry = { label: string; value: React.ReactNode; color?: string };

  const pricingBoxes: StatEntry[] = [
    { label: "Tag Price", value: fmt(product?.itemtagprice) },
    ...(listProduct?.itemsellprice != null
      ? [{ label: "Sell Price", value: fmt(listProduct.itemsellprice) }]
      : []),
    ...(isAtLeastManager
      ? [{ label: "Cost", value: fmt(product?.itempurchaseprice) }]
      : []),
    ...(isAtLeastManager && profitPct !== null
      ? [{ label: "Profit %", value: `${profitPct}%`, color: profitPct >= 0 ? "#15803d" : "#b91c1c" }]
      : []),
  ];

  const inventoryBoxes: StatEntry[] = [
    ...(availableQty !== null
      ? [{ label: "Available", value: `${availableQty}`, color: availColor }]
      : []),
    ...(listProduct?.itemquantityinhand !== undefined
      ? [{ label: "On Hand", value: `${listProduct.itemquantityinhand}` }]
      : []),
    ...(listProduct?.overall_qty !== undefined && listProduct.overall_qty !== null
      ? [{ label: "All Stores", value: `${listProduct.overall_qty}` }]
      : []),
  ];

  const content = (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 8px",
          height: 52,
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
          gap: 6,
        }}
      >
        <button
          onClick={handleClose}
          title="Close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            color: "#64748b",
            minHeight: 36,
          }}
        >
          {mode === "page" ? <ArrowLeft size={17} /> : <X size={17} />}
        </button>

        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product?.itemcode || itemcode}
        </span>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {listProduct && (
            <button
              onClick={() => setLabelsOpen(true)}
              title="Print Labels"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 7,
                padding: "0 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "#475569",
                height: 34,
              }}
            >
              <Printer size={13} />
              <span className="d-none d-sm-inline">Labels</span>
            </button>
          )}
          <button
            onClick={() =>
              router.push(
                `${basePath}/products/${encodeURIComponent(itemcode)}/edit`
              )
            }
            style={{
              background: "#0f172a",
              border: "none",
              borderRadius: 7,
              padding: "0 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#fff",
              height: 34,
            }}
          >
            <Edit size={12} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 180,
            }}
          >
            <div className="spinner-border spinner-border-sm text-secondary" />
          </div>
        ) : !product ? (
          <div
            style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}
          >
            Product not found.
          </div>
        ) : (
          <>
            {/* Alert */}
            {!!product.itemalertwarning && !!product.itemwarningmessage && (
              <div
                style={{
                  margin: "12px 14px 0",
                  background: "#fefce8",
                  border: "1px solid #fbbf24",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#92400e",
                }}
              >
                ⚠ {product.itemwarningmessage}
              </div>
            )}

            {/* Product identity */}
            <div
              style={{
                padding: "14px 14px 0",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.itemdescription}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Package size={32} color="#cbd5e1" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    marginBottom: 5,
                    wordBreak: "break-word",
                  }}
                >
                  {product.itemdescription}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    marginBottom: 8,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span>{product.itemcode}</span>
                  {product.itembarcodeid && product.itembarcodeid !== "0" && (
                    <span>▊ {product.itembarcodeid}</span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {badge(
                    isActive ? "#dbeafe" : "#f1f5f9",
                    isActive ? "#1e40af" : "#64748b",
                    `● ${isActive ? "Active" : "Inactive"}`
                  )}
                  {!!product.itemtaxable &&
                    badge("#dcfce7", "#15803d", "Taxable")}
                  {!!product.trackinventory &&
                    badge("#e0f2fe", "#0369a1", "Tracked")}
                </div>
              </div>
            </div>

            {/* Stats — two rows */}
            <div style={{ margin: "14px 0 0" }}>
              {/* Pricing row */}
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  borderBottom: "1px solid #e8edf2",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#b0bec5",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    padding: "5px 14px 0",
                  }}
                >
                  Pricing
                </div>
                <div style={{ display: "flex" }}>
                  {pricingBoxes.map((s, i) => (
                    <StatBox
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      valueColor={s.color}
                      borderRight={i < pricingBoxes.length - 1}
                    />
                  ))}
                </div>
              </div>
              {/* Inventory row */}
              {inventoryBoxes.length > 0 && (
                <div
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f0f4f8",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#b0bec5",
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      padding: "5px 14px 0",
                    }}
                  >
                    Inventory
                  </div>
                  <div style={{ display: "flex" }}>
                    {inventoryBoxes.map((s, i) => (
                      <StatBox
                        key={s.label}
                        label={s.label}
                        value={s.value}
                        valueColor={s.color}
                        borderRight={i < inventoryBoxes.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ padding: "14px 14px 4px" }}>
              <SectionTitle>Details</SectionTitle>
              {categoryName && <DetailRow label="Category" value={categoryName} />}
              {subcategoryName && <DetailRow label="Sub-Category" value={subcategoryName} />}
              {listProduct?.supplier && (
                <DetailRow label="Supplier" value={listProduct.supplier} />
              )}
              <DetailRow label="Supplier SKU" value={product.supplieritemcode} />
              <DetailRow label="Metal" value={product.itemmetal} />
              <DetailRow label="Model #" value={product.modelno} />
              <DetailRow label="Manufacturer" value={product.manufacturer} />
              <DetailRow label="Location" value={product.itemlocation} />
              <DetailRow label="Price Code" value={product.itemtagpricecode} />
              <DetailRow
                label="Discount"
                value={product.itemdiscount ? `${product.itemdiscount}%` : null}
              />
              {!!product.trackinventory && (
                <>
                  {listProduct?.soquantity !== undefined && (
                    <DetailRow
                      label="On S/O"
                      value={`${listProduct.soquantity}`}
                    />
                  )}
                  {listProduct?.memoqty !== undefined && (
                    <DetailRow
                      label="Memo Qty"
                      value={`${listProduct.memoqty}`}
                    />
                  )}
                  <DetailRow
                    label="Reorder Pt."
                    value={
                      product.itemreorderqtypnt
                        ? `${product.itemreorderqtypnt} units`
                        : null
                    }
                  />
                  <DetailRow
                    label="Reorder Qty"
                    value={
                      product.itemreorderqty
                        ? `${product.itemreorderqty} units`
                        : null
                    }
                  />
                </>
              )}
            </div>

            {/* Stone Certificate */}
            {hasDiamond && (
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  padding: "14px 14px 4px",
                }}
              >
                <SectionTitle>◈ Stone Certificate</SectionTitle>
                {[
                  { label: "Lab", value: product.dlab },
                  { label: "Shape", value: product.dshape },
                  { label: "Cert #", value: product.dcerno },
                  {
                    label: "Carat",
                    value: product.dcarat ? `${product.dcarat}ct` : null,
                  },
                  { label: "Color", value: product.dcolor },
                  { label: "Clarity", value: product.dclarity },
                  { label: "Cut", value: product.dculut },
                  { label: "Polish", value: product.dpolish },
                  { label: "Symmetry", value: product.dsymmetry },
                  { label: "Fluorescence", value: product.dflorence },
                  { label: "Measurements", value: product.dmesurement },
                  { label: "Stock #", value: product.dstockno },
                  {
                    label: "Rap Price",
                    value: product.drapprice ? fmt(product.drapprice) : null,
                  },
                  ...(isAtLeastManager
                    ? [
                        {
                          label: "Cost",
                          value: product.dcost ? fmt(product.dcost) : null,
                        },
                      ]
                    : []),
                  {
                    label: "Sale Price",
                    value: product.dsaleprice ? fmt(product.dsaleprice) : null,
                  },
                  { label: "Price Code", value: product.dpricecode },
                ]
                  .filter((f) => f.value)
                  .map((f) => (
                    <DetailRow key={f.label} label={f.label} value={f.value} />
                  ))}
              </div>
            )}

            {/* Tags & Notes */}
            {(tags.length > 0 ||
              product.itemremarks ||
              product.detaileditemdescription) && (
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  padding: "14px 14px 4px",
                }}
              >
                <SectionTitle>Notes</SectionTitle>
                {tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 5,
                      marginBottom: 10,
                    }}
                  >
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 16,
                          background: "#e0f2fe",
                          color: "#0369a1",
                          border: "1px solid #bae6fd",
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {product.itemremarks && (
                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 6, lineHeight: 1.5 }}>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>
                      Remarks:{" "}
                    </span>
                    {product.itemremarks}
                  </div>
                )}
                {product.detaileditemdescription && (
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>
                      Description:{" "}
                    </span>
                    {product.detaileditemdescription}
                  </div>
                )}
              </div>
            )}

            <div style={{ height: 28 }} />
          </>
        )}
      </div>

      {/* Labels modal */}
      {labelsOpen &&
        listProduct &&
        typeof window !== "undefined" &&
        createPortal(
          <PrintLabelsModal
            product={listProduct}
            onClose={() => setLabelsOpen(false)}
          />,
          document.body
        )}
    </>
  );

  // Drawer mode — right-side overlay via portal
  if (mode === "drawer" && mounted) {
    return createPortal(
      <>
        <div
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 1040,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(480px, 100vw)",
            background: "#fff",
            zIndex: 1041,
            transform: visible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.27s cubic-bezier(0.4,0,0.2,1)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-4px 0 32px rgba(15,23,42,0.14)",
          }}
        >
          {content}
        </div>
      </>,
      document.body
    );
  }

  // Page mode — centred card, no backdrop
  if (mode === "page") {
    return (
      <div style={{ maxWidth: 520, margin: "20px auto", padding: "0 12px 40px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return null;
};

export default ProductDrawer;
