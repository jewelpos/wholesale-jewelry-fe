"use client";

import React from "react";
import useMenu from "@/hooks/useMenu";
import PageHeader from "../../PageHeader";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import Link from "next/link";
import FeatherIcon from "../../FeatherIcon";

const InventoryTransferListHeader = () => {
  const { currentMenu, currentPath } = useMenu();

  const sectionPath = `${currentPath}${currentMenu?.menuurl ?? ""}`;

  const resolveHref = (actionName: string) => {
    if (actionName.includes("add_transfer_recieved")) {
      return `${sectionPath}/transfer_recieved`;
    }
    if (actionName.includes("add_transfer_request")) {
      return `${sectionPath}/transfer_request`;
    }
    if (actionName.includes("add_new_transfer")) {
      return `${sectionPath}/new_transfer`;
    }
    if (actionName.includes("edit_transfer_status")) {
      return `${sectionPath}/edit_transfer_status`;
    }
    return `${sectionPath}/new`;
  };

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Products"}
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
              return (
                <div
                  className="page-btn"
                  key={btn.actionname}
                >
                  <Link
                    href={resolveHref(btn.actionname)}
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

export default InventoryTransferListHeader;
