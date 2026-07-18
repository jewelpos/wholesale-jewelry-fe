"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

const CustomerChequeSummaryHeader = ({
  setOpenAddChequeModal,
  onExport,
  onPrint,
}: {
  setOpenAddChequeModal: (value: boolean) => void;
  onExport: () => void;
  onPrint: () => void;
}) => {
  const { currentMenu } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => {
      const onClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (btn.actionname === "add_new_checks") { setOpenAddChequeModal(true); return; }
        if (btn.actionname === "export_customer_onhand_check") { onExport(); return; }
        if (btn.actionname === "print_check_list") { onPrint(); return; }
      };
      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: "#",
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

export default CustomerChequeSummaryHeader;
