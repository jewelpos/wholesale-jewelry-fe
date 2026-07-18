"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

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

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => {
      if (a.actionorder < b.actionorder) return -1;
      if (a.actionorder > b.actionorder) return 1;
      return 0;
    })
    .map((btn: MenuAction): ActionDef => {
      const name = btn.actionname.toLowerCase();
      const isPrint   = name.includes("print");
      const isExport  = name.includes("export");
      const isEmail   = name.includes("email");
      const isCreateInvoice = name.includes("invoice") && name.includes("order");
      const isActionBtn = isPrint || isExport || isEmail || isCreateInvoice;

      const disabled =
        ((isPrint || isEmail) && selectedSalesOrderNumbers.length === 0) ||
        (isCreateInvoice && !canCreateInvoice);

      const href = isActionBtn ? "#" : `${basePath}/sales/new_sales_order`;

      const onClick = isActionBtn
        ? (e: React.MouseEvent) => {
            e.preventDefault();
            if (disabled) return;
            if (isCreateInvoice) { onCreateInvoiceFromOrder(); return; }
            if (isEmail)         { onEmailSalesOrder(); return; }
            if (isExport)        { onExport(); return; }
            onPrintSalesOrder();
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
        keepOnMobile: !isActionBtn,
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

export default SalesOrderHeader;
