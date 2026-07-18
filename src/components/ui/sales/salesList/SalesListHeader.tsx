"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

interface SalesListHeaderProps {
  selectedInvoiceNumbers: number[];
  onPrintInvoice: () => void;
  onEmailInvoice: () => void;
  onExport: () => void;
}

const sortRank = (name: string) => {
  if (name === "add_new_invoice")    return 0;
  if (name === "add_new_return")     return 1;
  if (name.includes("print"))        return 2;
  if (name.includes("email"))        return 3;
  if (name.includes("export"))       return 4;
  if (name.includes("sales_matrix")) return 5;
  return 6;
};

const SalesListHeader = ({
  selectedInvoiceNumbers,
  onPrintInvoice,
  onEmailInvoice,
  onExport,
}: SalesListHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();
  const { basePath } = useDefaultRoute();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => sortRank(a.actionname) - sortRank(b.actionname))
    .map((btn: MenuAction): ActionDef => {
      const isPrint  = btn.actionname.includes("print");
      const isExport = btn.actionname.includes("export");
      const isEmail  = btn.actionname.includes("email");
      const isMatrix = btn.actionname.includes("sales_matrix");
      const isAddInvoice = btn.actionname === "add_new_invoice";
      const isAddReturn  = btn.actionname === "add_new_return";
      const isActionBtn  = isPrint || isExport || isEmail;

      const disabled = selectedInvoiceNumbers.length === 0 && (isPrint || isEmail);

      const href = isAddInvoice
        ? `${basePath}/sales/new_invoice`
        : isAddReturn
          ? `${basePath}/sales/new_credit_invoice`
          : isMatrix
            ? `${basePath}/sales/sales_matrix`
            : isActionBtn
              ? "#"
              : `${currentPath}/new`;

      const onClick = isActionBtn
        ? (e: React.MouseEvent) => {
            e.preventDefault();
            if (disabled) return;
            if (isEmail)  { onEmailInvoice(); return; }
            if (isExport) { onExport(); return; }
            onPrintInvoice();
          }
        : undefined;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href,
        onClick,
        disabled,
        keepOnMobile: isAddInvoice || isAddReturn,
      };
    });

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
};

export default SalesListHeader;
