"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tag, Folder } from "react-feather";
import ReplaceCategoryPanel from "./ReplaceCategoryPanel";
import ReplaceSubcategoryPanel from "./ReplaceSubcategoryPanel";

type ToolKey = "category" | "subcategory";

const TOOLS: { key: ToolKey; label: string; description: string; icon: React.ElementType }[] = [
  {
    key: "category",
    label: "Replace Category",
    description: "Move every product from one category to another",
    icon: Folder,
  },
  {
    key: "subcategory",
    label: "Replace Subcategory",
    description: "Move every product under a subcategory to a different subcategory in the same category",
    icon: Tag,
  },
];

/**
 * System Tools > Update Product Sub/Category (storemenu id 86 — pre-seeded under the
 * System Tools menu since 2025, built out 2026-09-16). One page, list-and-detail like
 * Settings > Store Settings' warehouse list: pick a bulk-update option on the left,
 * its form appears on the right. More options can be added to TOOLS above later.
 */
const UpdateProductCategoriesComponent = () => {
  const router = useRouter();
  const { storePrefix, storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const [selectedTool, setSelectedTool] = useState<ToolKey>("category");

  return (
    <div style={{ padding: "4px 0 32px" }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="add-item d-flex justify-content-between align-items-center w-100">
          <div className="page-title">
            <h4>Update Product Sub/Category</h4>
            <h6>Bulk-move products from one category or subcategory to another</h6>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => router.push(`/${storePrefix}/${storeIdParam}/${outletIdParam}/home`)}
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="row mt-3">
        {/* Left: tool list */}
        <div className="col-lg-3 col-md-4 mb-3">
          <div className="card" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
            <div className="card-body p-0">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 13, color: "#475569" }}>
                Bulk Update Options
              </div>
              <ul className="list-unstyled mb-0">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const active = selectedTool === tool.key;
                  return (
                    <li
                      key={tool.key}
                      onClick={() => setSelectedTool(tool.key)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderLeft: active ? "3px solid #376fd0" : "3px solid transparent",
                        background: active ? "#f0f4ff" : "transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2" style={{ color: active ? "#376fd0" : "#334155", fontWeight: active ? 600 : 500, fontSize: 13 }}>
                        <Icon size={15} />
                        {tool.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, paddingLeft: 23 }}>
                        {tool.description}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: selected tool's panel */}
        <div className="col-lg-9 col-md-8">
          {selectedTool === "category" ? <ReplaceCategoryPanel /> : <ReplaceSubcategoryPanel />}
        </div>
      </div>
    </div>
  );
};

export default UpdateProductCategoriesComponent;
