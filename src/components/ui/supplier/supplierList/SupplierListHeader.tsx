"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import { paymentModalTypes } from "@/lib/config/constants";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

const SupplierListHeader = ({
  setShowInvoiceFormModal,
  setPaymentModal,
}: {
  setShowInvoiceFormModal: (value: boolean) => void;
  setPaymentModal: (value: string) => void;
}) => {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => {
      if (a.actionorder < b.actionorder) return -1;
      if (a.actionorder > b.actionorder) return 1;
      return 0;
    })
    .map((btn: MenuAction): ActionDef => {
      const isInvoice  = btn.actionname.includes("invoice");
      const isCredit   = btn.actionname.includes(paymentModalTypes.add_credit_adjustment);
      const isPayment  = btn.actionname.includes(paymentModalTypes.add_supplier_payment);
      const isModal    = isInvoice || isCredit || isPayment;

      const onClick = isModal
        ? (e: React.MouseEvent) => {
            e.preventDefault();
            if (isInvoice) setShowInvoiceFormModal(true);
            else setPaymentModal(btn.actionname);
          }
        : undefined;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: isModal ? "#" : `${currentPath}/new`,
        onClick,
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

export default SupplierListHeader;
