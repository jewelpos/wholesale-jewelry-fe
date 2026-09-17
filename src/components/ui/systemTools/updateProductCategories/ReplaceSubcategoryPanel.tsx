"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { RefreshCw } from "react-feather";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import showConfirmationDialog from "@/lib/utils/confirmationDialog";
import {
  GET_ITEM_CATEGORY_LIST_QUERY,
  GET_ITEM_SUB_CATEGORY_LIST_QUERY,
  GET_PRODUCT_COUNT_BY_CATEGORY_SUBCATEGORY_QUERY,
} from "@/lib/graphql/query/products";
import { BULK_REPLACE_PRODUCT_SUBCATEGORY_MUTATION } from "@/lib/graphql/mutations/products";

type CategoryRow = { categoryid: number; categoryname: string };
type SubcategoryRow = { subcategoryid: number; subcategoryname: string; categoryid: number };

const NO_FILTER_ARGS = { page: 1, perpage: 1000, filters: [], sortModel: [], rowGroupCols: [], groupKeys: [] };

/**
 * Category and subcategory are picked independently here — a subcategory's own
 * itemsubcategory.categoryid doesn't have to equal the category picked below, since
 * products can carry an itemcategoryid/subcategoryid combination that was never a
 * formally-linked pair (that's the "no hard link" the user has pointed out). So Category,
 * Current Subcategory and New Subcategory are three separate, unfiltered dropdowns; the
 * actual bulk update only touches products where itemcategoryid AND subcategoryid both
 * equal exactly what was picked — i.e. it replaces only where category and subcategory
 * both match.
 */
const ReplaceSubcategoryPanel = () => {
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [categoryId, setCategoryId] = useState<number | "">("");
  const [oldSubcategoryId, setOldSubcategoryId] = useState<number | "">("");
  const [newSubcategoryId, setNewSubcategoryId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const { data: categoryData, loading: categoriesLoading } = useQuery(GET_ITEM_CATEGORY_LIST_QUERY, {
    variables: { outletid: parsedOutletId, ...NO_FILTER_ARGS },
    skip: !parsedOutletId,
  });
  const categories: CategoryRow[] = useMemo(() => categoryData?.getItemCategoryList?.data ?? [], [categoryData]);
  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.categoryid, c.categoryname])), [categories]);

  const { data: subcategoryData, loading: subcategoriesLoading } = useQuery(GET_ITEM_SUB_CATEGORY_LIST_QUERY, {
    variables: { outletid: parsedOutletId, ...NO_FILTER_ARGS },
    skip: !parsedOutletId,
  });
  const allSubcategories: SubcategoryRow[] = useMemo(() => subcategoryData?.getItemSubCategoryList?.data ?? [], [subcategoryData]);

  const { data: countData, loading: countLoading } = useQuery(GET_PRODUCT_COUNT_BY_CATEGORY_SUBCATEGORY_QUERY, {
    variables: { storeid: parsedStoreId, categoryid: Number(categoryId), subcategoryid: Number(oldSubcategoryId) },
    skip: !parsedStoreId || !categoryId || !oldSubcategoryId,
    fetchPolicy: "network-only",
  });
  const affectedCount: number | null = (categoryId && oldSubcategoryId) ? (countData?.getProductCountByCategorySubcategory ?? null) : null;

  const [bulkReplaceSubcategory] = useMutation(BULK_REPLACE_PRODUCT_SUBCATEGORY_MUTATION);

  const categoryName = categoryNameById.get(categoryId as number) ?? "";
  const oldSubName = allSubcategories.find((s) => s.subcategoryid === oldSubcategoryId)?.subcategoryname ?? "";
  const newSubName = allSubcategories.find((s) => s.subcategoryid === newSubcategoryId)?.subcategoryname ?? "";
  const canSubmit = !!categoryId && !!oldSubcategoryId && !!newSubcategoryId && oldSubcategoryId !== newSubcategoryId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const confirmText = affectedCount != null
      ? `${affectedCount} product${affectedCount === 1 ? "" : "s"} in "${categoryName}" > "${oldSubName}" will be moved to "${newSubName}". This cannot be undone automatically.`
      : `All products in "${categoryName}" > "${oldSubName}" will be moved to "${newSubName}". This cannot be undone automatically.`;
    const confirmed = await showConfirmationDialog({
      title: "Replace subcategory on all matching products?",
      text: confirmText,
      confirmButtonText: "Yes, update products",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!confirmed.isConfirmed) return;

    setSubmitting(true);
    const result = await handleTryCatch(async () => {
      const { data } = await bulkReplaceSubcategory({
        variables: {
          storeid: parsedStoreId,
          categoryid: Number(categoryId),
          oldsubcategoryid: Number(oldSubcategoryId),
          newsubcategoryid: Number(newSubcategoryId),
        },
      });
      if (data?.bulkReplaceProductSubcategory?.success) {
        dispatch(showNotification({ message: data.bulkReplaceProductSubcategory.message, type: NOTIFICATION_TYPES.SUCCESS }));
        setOldSubcategoryId("");
        setNewSubcategoryId("");
      }
      return true;
    });
    setSubmitting(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  return (
    <div className="card" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
      <div className="card-body">
        <h6 className="mb-1" style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>Replace Subcategory</h6>
        <p className="text-muted mb-3" style={{ fontSize: 12 }}>
          Category and the two subcategory pickers below are independent — none of them filters the others. The
          update only touches products where both the selected category AND the selected current subcategory
          match exactly.
        </p>

        <div className="row g-3">
          <div className="col-md-12">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Category</label>
            <select
              className="form-select form-select-sm"
              value={categoryId}
              disabled={categoriesLoading}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row g-3 mt-0">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Current Subcategory</label>
            <select
              className="form-select form-select-sm"
              value={oldSubcategoryId}
              disabled={subcategoriesLoading}
              onChange={(e) => setOldSubcategoryId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select subcategory...</option>
              {allSubcategories.map((s) => (
                <option key={s.subcategoryid} value={s.subcategoryid}>
                  {s.subcategoryname} ({categoryNameById.get(s.categoryid) ?? "Unknown category"})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>New Subcategory</label>
            <select
              className="form-select form-select-sm"
              value={newSubcategoryId}
              disabled={subcategoriesLoading}
              onChange={(e) => setNewSubcategoryId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select subcategory...</option>
              {allSubcategories.filter((s) => s.subcategoryid !== oldSubcategoryId).map((s) => (
                <option key={s.subcategoryid} value={s.subcategoryid}>
                  {s.subcategoryname} ({categoryNameById.get(s.categoryid) ?? "Unknown category"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {!!categoryId && !!oldSubcategoryId && (
          <div className="mt-3 p-2" style={{ background: "#f8fafc", borderRadius: 6, fontSize: 12.5, color: "#475569" }}>
            {countLoading ? "Checking affected products..." : (
              <>
                <strong>{affectedCount ?? 0}</strong> product{affectedCount === 1 ? "" : "s"} currently in "{categoryName}" &gt; "{oldSubName}".
              </>
            )}
          </div>
        )}

        <div className="mt-3">
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            <RefreshCw size={14} className={submitting ? "spin" : ""} />
            {submitting ? "Updating..." : "Update Products"}
          </button>
          {!!oldSubcategoryId && !!newSubcategoryId && oldSubcategoryId === newSubcategoryId && (
            <div className="text-danger mt-2" style={{ fontSize: 12 }}>New subcategory must be different from the current subcategory.</div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  );
};

export default ReplaceSubcategoryPanel;
