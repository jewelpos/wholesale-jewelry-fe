"use client";

import React from "react";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import PageHeader from "../PageHeader";
import MobileActionsDropdown, { ActionDef } from "../MobileActionsDropdown";

const ACTION_ORDER: Record<string, number> = {
  add_new_purchaseorder: 1,
  add_return_order:      2,
  add_receive_poorder:   3,
  print:                 4,
  email:                 5,
  export:                6,
};

const actionPriority = (actionName: string) => {
  const key = Object.keys(ACTION_ORDER).find((k) => actionName.includes(k));
  return key ? ACTION_ORDER[key] : 99;
};

export default function PurchaseOrderListHeader({
  selectedPOs,
  handleExport,
  onExport,
  onEmail,
}: {
  selectedPOs: number[];
  handleExport: (ids: number[], type: string) => void;
  onExport: () => void;
  onEmail: () => void;
}) {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => actionPriority(a.actionname) - actionPriority(b.actionname))
    .map((btn: MenuAction): ActionDef => {
      const isPrint   = btn.actionname.includes("print");
      const isExport  = btn.actionname.includes("export");
      const isEmail   = btn.actionname.includes("email");
      const isActionBtn = isPrint || isExport || isEmail;
      const isNewPO   = btn.actionname.includes("add_new_purchaseorder");
      const isReceive = btn.actionname.includes("add_receive_poorder");

      const disabled = !selectedPOs.length && (isPrint || isEmail);

      const href = isActionBtn
        ? "#"
        : isReceive
          ? `${currentPath}/receiveorder_items`
          : btn.actionname.includes("add_return_order")
            ? `${currentPath}/return_order`
            : `${currentPath}/new_purchase_order`;

      const onClick = isActionBtn
        ? (e: React.MouseEvent) => {
            e.preventDefault();
            if (isPrint)  { handleExport(selectedPOs, "print"); return; }
            if (isExport) { onExport(); return; }
            onEmail();
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
        keepOnMobile: isNewPO || isReceive,
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
}
