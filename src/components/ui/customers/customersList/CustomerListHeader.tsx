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
import { paymentModalTypes } from "@/lib/config/constants";
import { useRouter } from "next/navigation";

interface CustomerListHeaderProps {
  selectedCustomerId?: number;
  setShowPrintModal: (value: boolean) => void;
  onExport: () => void;
}

const CustomerListHeader = ({
  selectedCustomerId,
  setShowPrintModal,
  onExport,
}: CustomerListHeaderProps) => {
  const { currentMenu, currentPath } = useMenu();
  const router = useRouter();

  const handleAction = (actionName: string) => {
    if (actionName.includes("print")) {
      setShowPrintModal(true);
    } else if (actionName.includes("export")) {
      onExport();
    } else if (actionName.includes(paymentModalTypes.add_customer_payment)) {
      router.push(`${currentPath}/applied_payments?modal=${encodeURIComponent(actionName)}`);
    } else if (actionName.includes(paymentModalTypes.add_credit_adjustment)) {
      router.push(`${currentPath}/applied_payments?modal=${encodeURIComponent(actionName)}`);
    } else if (
      actionName.includes(paymentModalTypes.add_invoice_credit_payment)
    ) {
      router.push(`${currentPath}/applied_payments?modal=${encodeURIComponent(actionName)}`);
    }
  };

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <div className="d-flex purchase-pg-btn">
        {!!currentMenu?.action.length &&
          [...currentMenu.action]
            .sort((a: MenuAction, b: MenuAction) => {
              if (a.actionorder < b.actionorder) return -1;
              if (a.actionorder > b.actionorder) return 1;
              return 0;
            })
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isPrintExportButton =
                btn.actionname.includes("print") || btn.actionname.includes("export");
              const isPaymentButton =
                btn.actionname.includes(paymentModalTypes.add_customer_payment) ||
                btn.actionname.includes(paymentModalTypes.add_credit_adjustment) ||
                btn.actionname.includes(
                  paymentModalTypes.add_invoice_credit_payment
                );
              // Print requires a selected customer; export is always enabled
              const disabledButton =
                !selectedCustomerId && btn.actionname.includes("print");

              const href = isPrintExportButton
                ? "#"
                : isPaymentButton
                  ? `${currentPath}/applied_payments?modal=${encodeURIComponent(
                      btn.actionname
                    )}`
                  : `${currentPath}/new`;

              return (
                <div
                  className="page-btn d-none d-sm-block"
                  key={btn.actionname}
                >
                  <Link
                    href={href}
                    onClick={() =>
                      isPrintExportButton && !disabledButton
                        ? handleAction(btn.actionname)
                        : null
                    }
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

export default CustomerListHeader;
