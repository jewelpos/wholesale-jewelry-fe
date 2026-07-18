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
  canCreateInvoice: boolean;
  onPrintSalesOrder: () => void;
  onEmailSalesOrder: () => void;
  onCreateInvoiceFromOrder: () => void;
  onExport: () => void;
}

const SalesOrderHeader = ({
  selectedSalesOrderNumbers,
  canCreateInvoice,
  onPrintSalesOrder,
  onEmailSalesOrder,
  onCreateInvoiceFromOrder,
  onExport,
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

              const isPrintButton = btn.actionname.includes("print");
              const isExportButton = btn.actionname.includes("export");
              const isEmailButton = btn.actionname.toLowerCase().includes("email");
              const isCreateInvoiceButton =
                btn.actionname.toLowerCase().includes("invoice") &&
                btn.actionname.toLowerCase().includes("order");
              const isActionButton = isPrintButton || isExportButton || isEmailButton || isCreateInvoiceButton;

              // Export is always enabled; print, email, create-invoice require selection
              const disabledButton =
                ((isPrintButton || isEmailButton) && selectedSalesOrderNumbers.length === 0) ||
                (isCreateInvoiceButton && !canCreateInvoice);

              const href = isActionButton ? "#" : `${basePath}/sales/new_sales_order`;

              const handleClick = (e: React.MouseEvent) => {
                if (!isActionButton) return;
                e.preventDefault();
                if (disabledButton) return;
                if (isCreateInvoiceButton) {
                  onCreateInvoiceFromOrder();
                } else if (isEmailButton) {
                  onEmailSalesOrder();
                } else if (isExportButton) {
                  onExport();
                } else {
                  onPrintSalesOrder();
                }
              };

              return (
                <div className="page-btn" key={btn.actionname}>
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
