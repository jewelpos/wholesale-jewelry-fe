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
}: {
  selectedPOs: number[];
  handleExport: (ids: number[], type: string) => void;
  onExport: () => void;
}) {
  const { currentMenu, currentPath } = useMenu();

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
              const isModalButton =
                btn.actionname.includes("print") ||
                btn.actionname.includes("export");
              // Export is always enabled; print requires a selection
              const disabledButton =
                !selectedPOs.length && btn.actionname.includes("print");
              return (
                <div
                  className="page-btn d-none d-sm-block"
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
