"use client";

import React from "react";
import PageHeader from "../../PageHeader";
import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import {
  renderActionButtonColor,
  renderActionButtonIconName,
} from "@/lib/utils/utils";
import FeatherIcon from "../../FeatherIcon";

interface SubCategoryHeaderProps {
  onOpenModal?: () => void;
}

const SubCategoryHeader: React.FC<SubCategoryHeaderProps> = ({ onOpenModal }) => {
  const { currentMenu } = useMenu();

  return (
    <PageHeader
      title={currentMenu?.permissiondisplayname || "Sub Categories"}
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
                  <button
                    onClick={onOpenModal}
                    className={`btn btn-added ${btnColor}`}
                    type="button"
                  >
                    {iconName && <FeatherIcon icon={iconName} />}{" "}
                    {btn.actiondisplayname}
                  </button>
                </div>
              );
            })}
      </div>
    </PageHeader>
  );
};

export default SubCategoryHeader;
