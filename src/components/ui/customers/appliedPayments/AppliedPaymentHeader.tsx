"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";
import { DollarSign } from "react-feather";
import { paymentModalTypes } from "@/lib/config/constants";
import { RECEIVE_PAYMENT } from "./PaymentModal";

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
  const { currentMenu } = useMenu();

  const isModalButton = (actionName: string) =>
    actionName === RECEIVE_PAYMENT ||
    actionName.includes(paymentModalTypes.add_customer_payment) ||
    actionName.includes(paymentModalTypes.add_credit_adjustment) ||
    actionName.includes(paymentModalTypes.add_invoice_credit_payment);

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action?.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => getButtonOrder(a.actionname) - getButtonOrder(b.actionname))
            .map((btn: MenuAction) => {
              const isReceivePayment = btn.actionname === RECEIVE_PAYMENT;
              const isPrint = btn.actionname.includes("print");
              const isEmail = btn.actionname.toLowerCase().includes("email");
              const isExport = btn.actionname.includes("export");

              const handleClick = isReceivePayment
                ? () => setPaymentModal(RECEIVE_PAYMENT)
                : isPrint
                  ? onPrint
                  : isEmail
                    ? onEmail
                    : isExport
                      ? onExport
                      : isModalButton(btn.actionname)
                        ? () => setPaymentModal(btn.actionname)
                        : undefined;

              if (!handleClick) return null;

              if (isReceivePayment) {
                return (
                  <div className="page-btn d-none d-sm-block" key={btn.actionname}>
                    <button
                      type="button"
                      className="btn btn-added"
                      onClick={handleClick}
                      style={{ background: "#1d4ed8", borderColor: "#1d4ed8" }}
                    >
                      <DollarSign size={14} className="me-1" />
                      {btn.actiondisplayname}
                    </button>
                  </div>
                );
              }

              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);

              return (
                <div className="page-btn d-none d-sm-block" key={btn.actionname}>
                  <button type="button" className={`btn btn-added ${btnColor}`} onClick={handleClick}>
                    {iconName && <FeatherIcon icon={iconName} />}
                    {btn.actiondisplayname}
                  </button>
                </div>
              );
            })}
      </div>
    </PageHeader>
  );
};

export default AppliedPaymentHeader;
