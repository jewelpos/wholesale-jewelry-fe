"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import useDefaultRoute from "@/hooks/useDefaultRoute";
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
  onEmailSalesOrder: () => void;
}

const SalesOrderHeader = ({
  selectedSalesOrderNumbers,
  onPrintSalesOrder,
  onEmailSalesOrder,
}: SalesOrderHeaderProps) => {
  const { currentMenu } = useMenu();
  const { basePath } = useDefaultRoute();

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
              const isEmailButton = btn.actionname.toLowerCase().includes("email");
              const isSelectionButton = isPrintExportButton || isEmailButton;

              const disabledButton =
                selectedSalesOrderNumbers.length === 0 && isSelectionButton;

              const href = isSelectionButton ? "#" : `${basePath}/sales/new_sales_order`;

              const handleClick = (e: React.MouseEvent) => {
                if (!isSelectionButton) return;
                e.preventDefault();
                if (disabledButton) return;
                if (isEmailButton) {
                  onEmailSalesOrder();
                } else {
                  onPrintSalesOrder();
                }
              };

              return (
                <div className="page-btn d-none d-sm-block" key={btn.actionname}>
                  <Link
                    href={href}
                    onClick={handleClick}
                    className={`btn btn-added ${btnColor} ${disabledButton ? "disabled" : ""}`}
                  >
                    {iconName && <FeatherIcon icon={iconName} />}{" "}
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
