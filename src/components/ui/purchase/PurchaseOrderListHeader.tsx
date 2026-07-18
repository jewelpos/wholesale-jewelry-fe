"use client";

import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import Link from "next/link";
import PageHeader from "../PageHeader";
import FeatherIcon from "../FeatherIcon";

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

  const resolveHref = (actionName: string) => {
    if (actionName.includes("add_receive_poorder")) {
      return `${currentPath}/receiveorder_items`;
    }
    if (actionName.includes("add_return_order")) {
      return `${currentPath}/return_order`;
    }
    if (actionName.includes("add_new_purchaseorder")) {
      return `${currentPath}/new_purchase_order`;
    }
    return `${currentPath}/new_purchase_order`;
  };

  const handleAction = (actionName: string) => {
    if (actionName.includes("print")) {
      handleExport(selectedPOs, "print");
    } else if (actionName.includes("export")) {
      onExport();
    } else if (actionName.includes("email")) {
      onEmail();
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
            .sort((a: MenuAction, b: MenuAction) =>
              actionPriority(a.actionname) - actionPriority(b.actionname)
            )
            .map((btn: MenuAction) => {
              const btnColor = renderActionButtonColor(btn.actionname);
              const iconName = renderActionButtonIconName(btn.actionname);
              const isModalButton =
                btn.actionname.includes("print") ||
                btn.actionname.includes("export") ||
                btn.actionname.includes("email");
              // Export is always enabled; print and email require a selection
              const disabledButton =
                !selectedPOs.length &&
                (btn.actionname.includes("print") || btn.actionname.includes("email"));
              return (
                <div
                  className="page-btn"
                  key={btn.actionname}
                >
                  <Link
                    href={isModalButton ? "#" : resolveHref(btn.actionname)}
                    onClick={() =>
                      isModalButton ? handleAction(btn.actionname) : null
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
}
