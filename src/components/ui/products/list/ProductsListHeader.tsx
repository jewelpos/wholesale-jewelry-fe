"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import { renderActionButtonColor, renderActionButtonIconName, renderActionButtonUrl } from "@/lib/utils/utils";
import MobileActionsDropdown, { ActionDef } from "../../MobileActionsDropdown";

interface ProductsListHeaderProps {
  onExport?: () => void;
}

const ProductsListHeader: React.FC<ProductsListHeaderProps> = ({ onExport }) => {
  const { currentMenu, currentPath } = useMenu();

  const actions: ActionDef[] = [...(currentMenu?.action ?? [])]
    .sort((a: MenuAction, b: MenuAction) => a.actionorder - b.actionorder)
    .map((btn: MenuAction): ActionDef => {
      const isExport = btn.actionname.includes("export");
      return {
        key: btn.actionname,
        label: btn.actiondisplayname,
        icon: renderActionButtonIconName(btn.actionname) || undefined,
        colorClass: renderActionButtonColor(btn.actionname),
        href: isExport ? "#" : renderActionButtonUrl(btn.actionname, currentPath),
        onClick: isExport
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              onExport?.();
            }
          : undefined,
      };
    });

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
