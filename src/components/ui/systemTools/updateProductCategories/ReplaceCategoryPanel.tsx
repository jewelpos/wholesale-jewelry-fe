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
import { GET_ITEM_CATEGORY_LIST_QUERY, GET_PRODUCT_COUNT_BY_CATEGORY_QUERY } from "@/lib/graphql/query/products";
import { BULK_REPLACE_PRODUCT_CATEGORY_MUTATION } from "@/lib/graphql/mutations/products";

type CategoryRow = { categoryid: number; categoryname: string };

const NO_FILTER_ARGS = { page: 1, perpage: 1000, filters: [], sortModel: [], rowGroupCols: [], groupKeys: [] };

const ReplaceCategoryPanel = () => {
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);

  const [oldCategoryId, setOldCategoryId] = useState<number | "">("");
  const [newCategoryId, setNewCategoryId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const { data: categoryData, loading: categoriesLoading } = useQuery(GET_ITEM_CATEGORY_LIST_QUERY, {
    variables: { outletid: parsedOutletId, ...NO_FILTER_ARGS },
    skip: !parsedOutletId,
  });
  const categories: CategoryRow[] = useMemo(() => categoryData?.getItemCategoryList?.data ?? [], [categoryData]);

  const { data: countData, loading: countLoading } = useQuery(GET_PRODUCT_COUNT_BY_CATEGORY_QUERY, {
    variables: { storeid: parsedStoreId, categoryid: Number(oldCategoryId) },
    skip: !parsedStoreId || !oldCategoryId,
    fetchPolicy: "network-only",
  });
  const affectedCount: number | null = oldCategoryId ? (countData?.getProductCountByCategory ?? null) : null;

  const [bulkReplaceCategory] = useMutation(BULK_REPLACE_PRODUCT_CATEGORY_MUTATION);

  const oldCategoryName = categories.find((c) => c.categoryid === oldCategoryId)?.categoryname ?? "";
  const newCategoryName = categories.find((c) => c.categoryid === newCategoryId)?.categoryname ?? "";
  const canSubmit = !!oldCategoryId && !!newCategoryId && oldCategoryId !== newCategoryId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const confirmText = affectedCount != null
      ? `${affectedCount} product${affectedCount === 1 ? "" : "s"} currently in "${oldCategoryName}" will be moved to "${newCategoryName}". This cannot be undone automatically.`
      : `All products currently in "${oldCategoryName}" will be moved to "${newCategoryName}". This cannot be undone automatically.`;
    const confirmed = await showConfirmationDialog({
      title: "Replace category on all matching products?",
      text: confirmText,
      confirmButtonText: "Yes, update products",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!confirmed.isConfirmed) return;

    setSubmitting(true);
    const result = await handleTryCatch(async () => {
      const { data } = await bulkReplaceCategory({
        variables: { storeid: parsedStoreId, oldcategoryid: Number(oldCategoryId), newcategoryid: Number(newCategoryId) },
      });
      if (data?.bulkReplaceProductCategory?.success) {
        dispatch(showNotification({ message: data.bulkReplaceProductCategory.message, type: NOTIFICATION_TYPES.SUCCESS }));
        setOldCategoryId("");
        setNewCategoryId("");
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
        <h6 className="mb-1" style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>Replace Category</h6>
        <p className="text-muted mb-3" style={{ fontSize: 12 }}>
          Every product currently assigned to the "Current Category" will be reassigned to the "New Category." The
          old category itself is not deleted.
        </p>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Current Category</label>
            <select
              className="form-select form-select-sm"
              value={oldCategoryId}
              disabled={categoriesLoading}
              onChange={(e) => setOldCategoryId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>New Category</label>
            <select
              className="form-select form-select-sm"
              value={newCategoryId}
              disabled={categoriesLoading}
              onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select category...</option>
              {categories.filter((c) => c.categoryid !== oldCategoryId).map((c) => (
                <option key={c.categoryid} value={c.categoryid}>{c.categoryname}</option>
              ))}
            </select>
          </div>
        </div>

        {!!oldCategoryId && (
          <div className="mt-3 p-2" style={{ background: "#f8fafc", borderRadius: 6, fontSize: 12.5, color: "#475569" }}>
            {countLoading ? "Checking affected products..." : (
              <>
                <strong>{affectedCount ?? 0}</strong> product{affectedCount === 1 ? "" : "s"} currently in "{oldCategoryName}".
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
          {!!oldCategoryId && !!newCategoryId && oldCategoryId === newCategoryId && (
            <div className="text-danger mt-2" style={{ fontSize: 12 }}>New category must be different from the current category.</div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  );
};

export default ReplaceCategoryPanel;
