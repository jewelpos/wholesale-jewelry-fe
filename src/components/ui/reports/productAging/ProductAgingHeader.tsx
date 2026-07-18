"use client";

import React from "react";
import PageHeader from "@/components/ui/PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "@/components/ui/MobileActionsDropdown";

interface ProductAgingHeaderProps {
  onExport?: () => void;
  viewMode?: "chart" | "grid";
  setViewMode?: (mode: "chart" | "grid") => void;
}

const ProductAgingHeader = ({ onExport, viewMode, setViewMode }: ProductAgingHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => {
      const isExport = btn.actionname.includes("export");
      const isModal  = btn.actionname.includes("print") || isExport;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: isModal ? "#" : `${currentPath}/new`,
        onClick: isModal
          ? (e: React.MouseEvent) => { e.preventDefault(); if (isExport) onExport?.(); }
          : undefined,
      };
    });

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {setViewMode && (
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <i data-feather="grid" style={{ width: 14, height: 14 }} /> Grid
            </button>
            <button
              type="button"
              className={`btn ${viewMode === "chart" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setViewMode("chart")}
              title="Chart view"
            >
              <i data-feather="bar-chart-2" style={{ width: 14, height: 14 }} /> Chart
            </button>
          </div>
        )}
        <MobileActionsDropdown actions={actions} />
      </div>
    </PageHeader>
  );
};

export default ProductAgingHeader;
