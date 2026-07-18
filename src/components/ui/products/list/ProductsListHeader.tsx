"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName, renderActionButtonUrl } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

const ProductsListHeader: React.FC = () => {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => ({
      key: btn.actionname,
      label: btn.actiondisplayname,
      icon: renderActionButtonIconName(btn.actionname) || undefined,
      colorClass: renderActionButtonColor(btn.actionname),
      href: renderActionButtonUrl(btn.actionname, currentPath),
    }));

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Products"}
      subtitle={currentMenu?.permissiondescription}
      showBreadcrumb
    >
      <MobileActionsDropdown actions={actions} />
    </PageHeader>
  );
};

export default ProductsListHeader;
