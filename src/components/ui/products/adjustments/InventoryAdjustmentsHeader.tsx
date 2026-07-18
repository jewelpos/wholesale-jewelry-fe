"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import Link from "next/link";
import FeatherIcon from "../../FeatherIcon";

interface InventoryAdjustmentsHeaderProps {
  onExport?: () => void;
  viewMode?: "chart" | "grid";
  setViewMode?: (mode: "chart" | "grid") => void;
}

const InventoryAdjustmentsHeader = ({ onExport, viewMode, setViewMode }: InventoryAdjustmentsHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Inventory Adjustments"}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex align-items-center gap-2 purchase-pg-btn">
        {setViewMode && (
          <div className="btn-group btn-group-sm me-2" role="group">
            <button
              type="button"
              className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-outline-secondary"}`}
              style={{ fontSize: 12, padding: "4px 12px" }}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              type="button"
              className={`btn ${viewMode === "chart" ? "btn-primary" : "btn-outline-secondary"}`}
              style={{ fontSize: 12, padding: "4px 12px" }}
              onClick={() => setViewMode("chart")}
            >
              Chart
            </button>
          </div>
        )}
        {!!currentMenu?.action.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isExportButton = btn.actionname.includes("export");
              const isModalButton = btn.actionname.includes("print") || isExportButton;

              const handleClick = (e: React.MouseEvent) => {
                if (!isModalButton) return;
                e.preventDefault();
                if (isExportButton && onExport) onExport();
              };

              return (
                <div className="page-btn" key={btn.actionname}>
                  <Link
                    href={isModalButton ? "#" : `${currentPath}/new`}
                    onClick={handleClick}
                    className={`btn btn-added ${btnColor}`}
                  >
                    {iconName && <FeatherIcon icon={iconName} />}
                    {btn.actiondisplayname}
                  </Link>
                </div>
              );
            })}
      </div>
    </PageHeader>
  );
};

export default InventoryAdjustmentsHeader;
