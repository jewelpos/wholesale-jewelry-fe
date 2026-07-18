"use client";

import React from "react";
import useMenu from "@/hooks/useMenu";
import PageHeader from "../../PageHeader";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";
import { CreditCard } from "react-feather";
import { PAY_SUPPLIER } from "./PaySupplierModal";

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
              const isPaySupplier = btn.actionname === PAY_SUPPLIER;
              const isExportButton = btn.actionname.includes("export");

              if (isPaySupplier) {
                return (
                  <div className="page-btn" key={btn.actionname}>
                    <button
                      type="button"
                      className="btn btn-added"
                      onClick={() => setPaymentModal(PAY_SUPPLIER)}
                      style={{ background: "#15803d", borderColor: "#15803d" }}
                    >
                      <CreditCard size={14} className="me-1" />
                      {btn.actiondisplayname}
                    </button>
                  </div>
                );
              }

              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);

              return (
                <div className="page-btn" key={btn.actionname}>
                  <button
                    type="button"
                    className={`btn btn-added ${btnColor}`}
                    onClick={isExportButton ? () => onExport() : undefined}
                  >
                    {iconName && <FeatherIcon icon={iconName} />}
                    {btn.actiondisplayname}
                  </button>
                </div>
              );
            })}
      </div>
    </PageHeader>
  );
}
