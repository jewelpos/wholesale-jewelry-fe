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
import useDefaultRoute from "@/hooks/useDefaultRoute";

interface SalesListHeaderProps {
  selectedInvoiceNumbers: number[];
  onPrintInvoice: () => void;
  onEmailInvoice: () => void;
  onExport: () => void;
}

const SalesListHeader = ({
  selectedInvoiceNumbers,
  onPrintInvoice,
  onEmailInvoice,
  onExport,
}: SalesListHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();
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
              const rank = (name: string) => {
                if (name === "add_new_invoice")      return 0;
                if (name === "add_new_return")       return 1;
                if (name.includes("print"))          return 2;
                if (name.includes("email"))          return 3;
                if (name.includes("export"))         return 4;
                if (name.includes("sales_matrix"))   return 5;
                return 6;
              };
              return rank(a.actionname) - rank(b.actionname);
            })
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isPrintButton = btn.actionname.includes("print");
              const isExportButton = btn.actionname.includes("export");
              const isEmailButton = btn.actionname.includes("email");
              const isActionButton = isPrintButton || isExportButton || isEmailButton;
              const isSalesMatrix = btn.actionname.includes("sales_matrix");

              const isAddNewInvoiceAction = btn.actionname === "add_new_invoice";
              const isAddNewReturnAction = btn.actionname === "add_new_return";

              if (isSalesMatrix) {
                return (
                  <div className="page-btn d-none d-sm-block" key={btn.actionname}>
                    <Link
                      href={`${basePath}/sales/sales_matrix`}
                      className={`btn btn-added ${btnColor}`}
                    >
                      {iconName && <FeatherIcon icon={iconName} />}
                      {btn.actiondisplayname}
                    </Link>
                  </div>
                );
              }

              // Export is always enabled; print and email require a selection
              const disabledButton =
                selectedInvoiceNumbers.length === 0 && (isPrintButton || isEmailButton);

              const href = isActionButton
                ? "#"
                : isAddNewInvoiceAction
                  ? `${basePath}/sales/new_invoice`
                  : isAddNewReturnAction
                    ? `${basePath}/sales/new_credit_invoice`
                  : `${currentPath}/new`;

              const handleClick = (e: React.MouseEvent) => {
                if (!isActionButton) return;
                e.preventDefault();
                if (disabledButton) return;
                if (isEmailButton) { onEmailInvoice(); return; }
                if (isExportButton) { onExport(); return; }
                onPrintInvoice();
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

export default SalesListHeader;
