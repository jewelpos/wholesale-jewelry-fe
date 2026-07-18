"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import { paymentModalTypes } from "@/lib/config/constants";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

const RECEIVE_PAYMENT = "receive_payment";

const BUTTON_ORDER: Record<string, number> = {
  receive_payment: 0,
  [paymentModalTypes.add_customer_payment]: 1,
  [paymentModalTypes.add_credit_adjustment]: 2,
  [paymentModalTypes.add_invoice_credit_payment]: 3,
  print: 4,
  email: 5,
  export: 6,
};

const getButtonOrder = (actionName: string): number => {
  for (const [key, order] of Object.entries(BUTTON_ORDER)) {
    if (actionName.includes(key)) return order;
  }
  return 99;
};

interface AppliedPaymentHeaderProps {
  setPaymentModal: (value: string) => void;
  onPrint?: () => void;
  onEmail?: () => void;
  onExport?: () => void;
}

const AppliedPaymentHeader = ({ setPaymentModal, onPrint, onEmail, onExport }: AppliedPaymentHeaderProps) => {
  const { currentMenu, basePath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => getButtonOrder(a.actionname) - getButtonOrder(b.actionname))
    .map((btn: MenuAction): ActionDef => {
      const isReceivePayment = btn.actionname === RECEIVE_PAYMENT;
      const isPaymentMatrix  = btn.actionname.includes("payment_matrix");
      const isPrint  = btn.actionname.includes("print");
      const isEmail  = btn.actionname.toLowerCase().includes("email");
      const isExport = btn.actionname.includes("export");
      const isModal  =
        btn.actionname.includes(paymentModalTypes.add_customer_payment) ||
        btn.actionname.includes(paymentModalTypes.add_credit_adjustment) ||
        btn.actionname.includes(paymentModalTypes.add_invoice_credit_payment);

      if (isPaymentMatrix) {
        return {
          key: btn.actionname,
          label: btn.actiondisplayname,
          icon: renderActionButtonIconName(btn.actionname) || undefined,
          colorClass: renderActionButtonColor(btn.actionname),
          href: `${basePath}/accounts/payment_matrix`,
        };
      }

      const onClick = isReceivePayment
        ? (e: React.MouseEvent) => { e.preventDefault(); setPaymentModal(RECEIVE_PAYMENT); }
        : isPrint
          ? (e: React.MouseEvent) => { e.preventDefault(); onPrint?.(); }
          : isEmail
            ? (e: React.MouseEvent) => { e.preventDefault(); onEmail?.(); }
            : isExport
              ? (e: React.MouseEvent) => { e.preventDefault(); onExport?.(); }
              : isModal
                ? (e: React.MouseEvent) => { e.preventDefault(); setPaymentModal(btn.actionname); }
                : undefined;

      if (!onClick) return null as unknown as ActionDef;

      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: isReceivePayment ? "dollar-sign" : (renderActionButtonIconName(btn.actionname) || undefined),
        colorClass: isReceivePayment ? "" : renderActionButtonColor(btn.actionname),
        href: "#",
        style: isReceivePayment ? { background: "#1d4ed8", borderColor: "#1d4ed8", color: "#fff" } : undefined,
        onClick,
      };
    })
    .filter(Boolean) as ActionDef[];

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

export default AppliedPaymentHeader;
