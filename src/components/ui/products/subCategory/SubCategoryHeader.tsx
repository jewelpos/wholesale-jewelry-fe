"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

interface SubCategoryHeaderProps {
  onOpenModal?: () => void;
}

const SubCategoryHeader: React.FC<SubCategoryHeaderProps> = ({ onOpenModal }) => {
  const { currentMenu } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => ({
      key: btn.actionname,
      label: btn.actiondisplayname,
      icon: renderActionButtonIconName(btn.actionname) || undefined,
      colorClass: renderActionButtonColor(btn.actionname),
      href: "#",
      onClick: (e) => { e.preventDefault(); onOpenModal?.(); },
    }));

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Sub Categories"}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
};

export default SubCategoryHeader;
