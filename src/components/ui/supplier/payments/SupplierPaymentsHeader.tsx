"use client";

import React from "react";
import useMenu from "@/hooks/useMenu";
import PageHeader from "../../PageHeader";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import { PAY_SUPPLIER } from "./PaySupplierModal";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

const BUTTON_ORDER: Record<string, number> = {
  [PAY_SUPPLIER]: 0,
  print: 1,
  email: 2,
  export: 3,
};

const getButtonOrder = (actionName: string): number => {
  for (const [key, order] of Object.entries(BUTTON_ORDER)) {
    if (actionName.includes(key)) return order;
  }
  return 99;
};

interface SupplierPaymentsHeaderProps {
  setPaymentModal: (value: string) => void;
  onExport: () => void;
}

export default function SupplierPaymentsHeader({ setPaymentModal, onExport }: SupplierPaymentsHeaderProps) {
  const { currentMenu } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => getButtonOrder(a.actionname) - getButtonOrder(b.actionname))
    .map((btn: MenuAction): ActionDef => {
      const isPaySupplier = btn.actionname === PAY_SUPPLIER;
      const isExport      = btn.actionname.includes("export");

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: isPaySupplier ? "credit-card" : (renderActionButtonIconName(btn.actionname) || undefined),
        colorClass: isPaySupplier ? "" : renderActionButtonColor(btn.actionname),
        href: "#",
        style: isPaySupplier ? { background: "#15803d", borderColor: "#15803d", color: "#fff" } : undefined,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          if (isPaySupplier) { setPaymentModal(PAY_SUPPLIER); return; }
          if (isExport) { onExport(); return; }
        },
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
