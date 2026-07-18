"use client";

import PageHeader from "@/components/ui/PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import Link from "next/link";
import FeatherIcon from "@/components/ui/FeatherIcon";

interface ProductAgingHeaderProps {
  onExport?: () => void;
  viewMode?: "chart" | "grid";
  setViewMode?: (mode: "chart" | "grid") => void;
}

const ProductAgingHeader = ({ onExport, viewMode, setViewMode }: ProductAgingHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex align-items-center gap-2 purchase-pg-btn">
        {setViewMode && (
          <div className="btn-group btn-group-sm me-2" role="group">
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

export default ProductAgingHeader;
