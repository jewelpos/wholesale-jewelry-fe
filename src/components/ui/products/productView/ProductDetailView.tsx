"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { Package, Edit, Printer, ArrowLeft } from "react-feather";
import {
  GET_PRODUCT_BY_ITEMCODE_QUERY,
  GET_ITEM_CATEGORIES_QUERY,
  GET_ITEM_SUBCATEGORIES_QUERY,
  GET_PRODUCT_LIST_QUERY,
} from "@/lib/graphql/query/products";
import { useUserRole } from "@/hooks/useUserRole";
import useDefaultRoute from "@/hooks/useDefaultRoute";
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

function formatPrice(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

const StatChip = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e9ecef",
      borderRadius: 10,
      padding: "14px 18px",
      textAlign: "center",
      minHeight: 70,
      flex: 1,
      minWidth: 100,
    }}
  >
    <div
      style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: "#888",
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color: valueColor || "#212529" }}>
      {value}
    </div>
  </div>
);

const AttrRow = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div style={{ display: "flex", paddingBottom: 10 }}>
      <span
        style={{
          fontSize: 12,
          color: "#6c757d",
          minWidth: 120,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: "#212529", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
};

const StockItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value?: number | null;
  color?: string;
}) => {
  if (value === null || value === undefined) return null;
  return (
    <div style={{ minWidth: 80 }}>
      <div
        style={{
          fontSize: 10,
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || "#212529" }}>
        {value}
      </div>
    </div>
  );
};

const CertField = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <div style={{ minWidth: 100, paddingBottom: 4 }}>
      <div
        style={{
          fontSize: 10,
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#212529" }}>
        {value}
      </div>
    </div>
  );
};

const ProductDetailView = () => {
  const {
    storeId: storeIdParam,
    outletId: outletIdParam,
    itemcode: itemcodeParam,
  } = useParams();
  const router = useRouter();
  const { basePath } = useDefaultRoute();
  const { isAtLeastManager } = useUserRole();
  const [labelsOpen, setLabelsOpen] = useState(false);

  const storeId = parseInt(storeIdParam as string, 10);
  const outletId = parseInt(outletIdParam as string, 10);
  const itemcode = itemcodeParam as string;

  const { data: productData, loading: productLoading } = useQuery(
    GET_PRODUCT_BY_ITEMCODE_QUERY,
    {
      variables: { itemcode, storeid: storeId },
      skip: !itemcode || !storeId,
    }
  );

  const { data: categoriesData } = useQuery(GET_ITEM_CATEGORIES_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId,
  });

  const product = productData?.getProductByItemCode;
  const categoryId = product?.itemcategoryid;

  const { data: subcategoriesData } = useQuery(GET_ITEM_SUBCATEGORIES_QUERY, {
    variables: { storeid: storeId, categoryid: categoryId },
    skip: !storeId || !categoryId,
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
    if (!categoriesData?.getItemCategories || !product?.itemcategoryid)
      return null;
    return (
      categoriesData.getItemCategories.find(
        (c: any) => c.categoryid === product.itemcategoryid
      )?.categoryname ?? null
    );
  }, [categoriesData, product]);

  const subcategoryName = useMemo(() => {
    if (!subcategoriesData?.getItemSubcategories || !product?.subcategoryid)
      return null;
    return (
      subcategoriesData.getItemSubcategories.find(
        (s: any) => s.subcategoryid === product.subcategoryid
      )?.subcategoryname ?? null
    );
  }, [subcategoriesData, product]);

  const imageUrl = useMemo(
    () => parseFirstImageUrl(product?.itemimagepath),
    [product]
  );

  const tags = useMemo(() => {
    if (!product) return [];
    return [
      product.tag1, product.tag2, product.tag3, product.tag4, product.tag5,
      product.tag6, product.tag7, product.tag8, product.tag9, product.tag10,
    ].filter(Boolean);
  }, [product]);

  const hasDiamondData = useMemo(() => {
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
      ? "#212529"
      : availableQty <= 0
      ? "#dc3545"
      : reorderPt && availableQty <= reorderPt
      ? "#fd7e14"
      : "#198754";

  const categoryPath = [categoryName, subcategoryName].filter(Boolean).join(" › ");
  const supplierName = listProduct?.supplier ?? null;
  const isActive = product?.itemstatus === "Active";

  if (productLoading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: 300 }}
      >
        <div className="spinner-border text-secondary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: 300 }}
      >
        <p className="text-muted">Product not found.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Sticky Nav Bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e9ecef",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          minHeight: 52,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "#495057",
            padding: "6px 0",
            minHeight: 44,
          }}
        >
          <ArrowLeft size={16} />
          <span>Products</span>
          {categoryPath && (
            <span style={{ color: "#adb5bd" }}> · {categoryPath}</span>
          )}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => router.push(`${basePath}/products/${encodeURIComponent(itemcode)}/edit`)}
            style={{
              background: "#fff",
              border: "1px solid #dee2e6",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              minHeight: 44,
              color: "#212529",
            }}
          >
            <Edit size={14} />
            <span className="d-none d-sm-inline">Edit</span>
          </button>
          {listProduct && (
            <button
              onClick={() => setLabelsOpen(true)}
              style={{
                background: "#fff",
                border: "1px solid #dee2e6",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
                color: "#212529",
              }}
            >
              <Printer size={14} />
              <span className="d-none d-sm-inline">Labels</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 12px 0" }}>
        {/* Alert Strip */}
        {product.itemalertwarning && product.itemwarningmessage && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 12,
              fontSize: 13,
              color: "#856404",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⚠ <strong>{product.itemcode}</strong> — {product.itemwarningmessage}
          </div>
        )}

        {/* Hero Image Card */}
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
            position: "relative",
            background: imageUrl ? undefined : "#efefef",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.itemdescription}
              style={{
                width: "100%",
                height: "clamp(160px, 25vw, 240px)",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "clamp(160px, 25vw, 240px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={64} color="#ccc" />
            </div>
          )}

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.68) 100%)",
              padding: "50px 16px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 17,
                    fontWeight: 700,
                    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {product.itemdescription}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.82)",
                    fontSize: 12,
                    marginTop: 4,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span>{product.itemcode}</span>
                  {product.itembarcodeid && (
                    <span>▊ {product.itembarcodeid}</span>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  background: isActive ? "#d1fae5" : "#f3f4f6",
                  color: isActive ? "#065f46" : "#6b7280",
                }}
              >
                ● {isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>
        </div>

        {/* Stat Chips */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            overflowX: "auto",
            paddingBottom: 4,
            WebkitOverflowScrolling: "touch" as any,
          }}
        >
          <StatChip label="Tag Price" value={formatPrice(product.itemtagprice)} />
          {isAtLeastManager && (
            <StatChip
              label="Cost Price"
              value={formatPrice(product.itempurchaseprice)}
            />
          )}
          <StatChip
            label="Available"
            value={availableQty !== null ? `${availableQty}` : "—"}
            valueColor={availColor}
          />
          {listProduct?.itemquantityinhand !== undefined && (
            <StatChip
              label="On Hand"
              value={`${listProduct.itemquantityinhand}`}
            />
          )}
        </div>

        {/* Attribute Grid */}
        <div
          className="card"
          style={{
            borderRadius: 12,
            border: "1px solid #e9ecef",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            marginBottom: 12,
          }}
        >
          <div className="card-body" style={{ padding: "16px 20px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: 14,
              }}
            >
              ABOUT THIS ITEM
            </div>
            <div className="row g-0">
              <div className="col-md-6">
                {categoryPath && <AttrRow label="Category" value={categoryPath} />}
                {supplierName && <AttrRow label="Supplier" value={supplierName} />}
                <AttrRow label="Supplier SKU" value={product.supplieritemcode} />
                <AttrRow label="Model #" value={product.modelno} />
                <AttrRow label="Manufacturer" value={product.manufacturer} />
                <AttrRow label="Location" value={product.itemlocation} />
              </div>
              <div className="col-md-6">
                <AttrRow label="Metal" value={product.itemmetal} />
                <AttrRow label="Price Code" value={product.itemtagpricecode} />
                <AttrRow
                  label="Discount"
                  value={
                    product.itemdiscount ? `${product.itemdiscount}%` : null
                  }
                />
                <AttrRow
                  label="Reorder Pt."
                  value={
                    product.itemreorderqtypnt
                      ? `${product.itemreorderqtypnt} units`
                      : null
                  }
                />
                <AttrRow
                  label="Reorder Qty"
                  value={
                    product.itemreorderqty
                      ? `${product.itemreorderqty} units`
                      : null
                  }
                />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    paddingBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {product.itemtaxable && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontWeight: 600,
                        background: "#e8f4fd",
                        color: "#0d6efd",
                        border: "1px solid #b8d8f8",
                      }}
                    >
                      Taxable ✓
                    </span>
                  )}
                  {product.trackinventory && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontWeight: 600,
                        background: "#e8f4fd",
                        color: "#0d6efd",
                        border: "1px solid #b8d8f8",
                      }}
                    >
                      Track Inv. ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Levels */}
        {product.trackinventory && listProduct && (
          <div
            className="card"
            style={{
              borderRadius: 12,
              border: "1px solid #e9ecef",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              marginBottom: 12,
            }}
          >
            <div className="card-body" style={{ padding: "14px 20px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginBottom: 14,
                }}
              >
                STOCK LEVELS
                {listProduct.warehousename && (
                  <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 11, color: "#aaa" }}>
                    {listProduct.warehousename}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px 28px",
                }}
              >
                <StockItem label="On Hand" value={listProduct.itemquantityinhand} />
                <StockItem label="On S/O" value={listProduct.soquantity} />
                <StockItem label="Memo" value={listProduct.memoqty} />
                <StockItem
                  label="Available"
                  value={listProduct.availableqty}
                  color={availColor}
                />
                {reorderPt !== null && reorderPt !== undefined && (
                  <StockItem label="Reorder Pt." value={reorderPt} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stone Certificate */}
        {hasDiamondData && (
          <div
            className="card"
            style={{
              borderRadius: 12,
              borderLeft: "3px solid #6c757d",
              border: "1px solid #e9ecef",
              background: "#fafafa",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              marginBottom: 12,
            }}
          >
            <div className="card-body" style={{ padding: "14px 20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  ◈ STONE CERTIFICATE
                </div>
                {product.dlab && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#495057",
                      padding: "3px 10px",
                      background: "#e9ecef",
                      borderRadius: 20,
                    }}
                  >
                    {product.dlab}
                  </span>
                )}
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}
              >
                <CertField label="Cert #" value={product.dcerno} />
                <CertField label="Shape" value={product.dshape} />
                <CertField
                  label="Carat"
                  value={product.dcarat ? `${product.dcarat}ct` : null}
                />
                <CertField label="Color" value={product.dcolor} />
                <CertField label="Clarity" value={product.dclarity} />
                <CertField label="Cut" value={product.dculut} />
                <CertField label="Polish" value={product.dpolish} />
                <CertField label="Symmetry" value={product.dsymmetry} />
                <CertField label="Fluorescence" value={product.dflorence} />
                <CertField label="Measurements" value={product.dmesurement} />
                <CertField label="Size" value={product.dsize} />
                <CertField label="Quality" value={product.dquality} />
                <CertField label="Stock #" value={product.dstockno} />
                <CertField
                  label="Rap Price"
                  value={product.drapprice ? formatPrice(product.drapprice) : null}
                />
                {isAtLeastManager && (
                  <CertField
                    label="Cost"
                    value={product.dcost ? formatPrice(product.dcost) : null}
                  />
                )}
                <CertField
                  label="Sale Price"
                  value={product.dsaleprice ? formatPrice(product.dsaleprice) : null}
                />
                <CertField label="Price Code" value={product.dpricecode} />
              </div>
            </div>
          </div>
        )}

        {/* Tags & Notes */}
        {(tags.length > 0 ||
          product.itemremarks ||
          product.detaileditemdescription) && (
          <div
            className="card"
            style={{
              borderRadius: 12,
              border: "1px solid #e9ecef",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              marginBottom: 12,
            }}
          >
            <div className="card-body" style={{ padding: "14px 20px" }}>
              {tags.length > 0 && (
                <div
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontWeight: 500,
                        background: "#f0f0f0",
                        color: "#495057",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {product.itemremarks && (
                <div style={{ marginBottom: product.detaileditemdescription ? 10 : 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#888",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 4,
                    }}
                  >
                    Remarks
                  </div>
                  <div style={{ fontSize: 13, color: "#495057" }}>
                    {product.itemremarks}
                  </div>
                </div>
              )}
              {product.detaileditemdescription && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#888",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 4,
                    }}
                  >
                    Description
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#495057",
                      lineHeight: 1.6,
                    }}
                  >
                    {product.detaileditemdescription}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print Labels Modal */}
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
    </div>
  );
};

export default ProductDetailView;
