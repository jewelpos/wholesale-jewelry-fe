"use client";

import React from "react";
import PageHeader from "@/components/ui/PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "@/components/ui/MobileActionsDropdown";

interface CommissionReportHeaderProps {
  onPrint: () => void;
  onSummary: () => void;
  printDisabled?: boolean;
}

const CommissionReportHeader = ({ onPrint, onSummary, printDisabled }: CommissionReportHeaderProps) => {
  const { currentMenu } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => {
      const isSummary = btn.actionname.includes("summary");
      const isPrint = btn.actionname.includes("print") && !isSummary;
      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: "#",
        disabled: isPrint ? printDisabled : false,
        onClick: isSummary
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              onSummary();
            }
          : isPrint
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              onPrint();
            }
          : undefined,
      };
    });

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Commission Report"}
      subtitle={currentMenu?.permissiondescription || "Sales rep commission earned per period with payout tracking"}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
};

export default CommissionReportHeader;
