"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import { paymentModalTypes } from "@/lib/config/constants";
import { useRouter } from "next/navigation";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

interface CustomerListHeaderProps {
  selectedCustomerId?: number;
  setShowPrintModal: (value: boolean) => void;
  onExport: () => void;
}

const CustomerListHeader = ({ selectedCustomerId, setShowPrintModal, onExport }: CustomerListHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();
  const router = useRouter();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => {
      if (a.actionorder < b.actionorder) return -1;
      if (a.actionorder > b.actionorder) return 1;
      return 0;
    })
    .map((btn: MenuAction): ActionDef => {
      const isPrint   = btn.actionname.includes("print");
      const isExport  = btn.actionname.includes("export");
      const isPayment =
        btn.actionname.includes(paymentModalTypes.add_customer_payment) ||
        btn.actionname.includes(paymentModalTypes.add_credit_adjustment) ||
        btn.actionname.includes(paymentModalTypes.add_invoice_credit_payment);

      const disabled = isPrint && !selectedCustomerId;

      const href = isExport || isPrint
        ? "#"
        : isPayment
          ? `${currentPath}/applied_payments?modal=${encodeURIComponent(btn.actionname)}`
          : `${currentPath}/new`;

      const onClick = isPrint
        ? (e: React.MouseEvent) => { e.preventDefault(); if (!disabled) setShowPrintModal(true); }
        : isExport
          ? (e: React.MouseEvent) => { e.preventDefault(); onExport(); }
          : isPayment
            ? (e: React.MouseEvent) => { e.preventDefault(); router.push(href); }
            : undefined;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href,
        onClick,
        disabled,
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

export default CustomerListHeader;
