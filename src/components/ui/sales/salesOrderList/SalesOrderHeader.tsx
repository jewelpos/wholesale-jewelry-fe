"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import Link from "next/link";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";

interface SalesOrderHeaderProps {
  selectedSalesOrderNumbers: number[];
  onPrintSalesOrder: () => void;
}

const SalesOrderHeader = ({
  selectedSalesOrderNumbers,
  onPrintSalesOrder,
}: SalesOrderHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action?.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => {
              if (a.actionorder < b.actionorder) return -1;
              if (a.actionorder > b.actionorder) return 1;
              return 0;
            })
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isPrintExportButton =
                btn.actionname.includes("print") || btn.actionname.includes("export");

              const disabledButton =
                selectedSalesOrderNumbers.length === 0 &&
                (btn.actionname.includes("print") || btn.actionname.includes("export"));

              const href = isPrintExportButton ? "#" : `${currentPath}/new`;

              const handleClick = (e: React.MouseEvent) => {
                if (!isPrintExportButton) return;
                e.preventDefault();
                if (disabledButton) return;
                onPrintSalesOrder();
              };

              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={href}
                    onClick={handleClick}
                    className={`btn btn-added ${btnColor} ${
                      disabledButton ? "disabled" : ""
                    }`}
                  >
                    {iconName && <FeatherIcon icon={iconName} />} {" "}
                    {btn.actiondisplayname}
                  </Link>
                </div>
              );
            })}
      </div>
    </PageHeader>
  );
};

export default SalesOrderHeader;
