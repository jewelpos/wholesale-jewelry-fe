"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";
import Link from "next/link";
import { paymentModalTypes } from "@/lib/config/constants";

interface AppliedPaymentHeaderProps {
  setPaymentModal: (value: string) => void;
}

const AppliedPaymentHeader = ({ setPaymentModal }: AppliedPaymentHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();

  const handleAction = (actionName: string) => {
    if (
      actionName.includes(paymentModalTypes.add_customer_payment) ||
      actionName.includes(paymentModalTypes.add_credit_adjustment) ||
      actionName.includes(paymentModalTypes.add_invoice_credit_payment)
    ) {
      setPaymentModal(actionName);
    }
  };

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
              const isModalButton =
                btn.actionname.includes(paymentModalTypes.add_customer_payment) ||
                btn.actionname.includes(paymentModalTypes.add_credit_adjustment) ||
                btn.actionname.includes(
                  paymentModalTypes.add_invoice_credit_payment
                );
              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={isModalButton ? "#" : `${currentPath}/new`}
                    onClick={() => (isModalButton ? handleAction(btn.actionname) : null)}
                    className={`btn btn-added ${btnColor}`}
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

export default AppliedPaymentHeader;
