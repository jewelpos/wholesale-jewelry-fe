"use client";

import useMenu from "@/hooks/useMenu";
import { MenuAction } from "@/types/permissions";
import Link from "next/link";
import React from "react";
import FeatherIcon from "./FeatherIcon";

const PageActions = ({
  handleAction,
  disabledButtons,
  modalButtons,
}: {
  handleAction: (action: string) => void;
  disabledButtons?: string[];
  modalButtons?: string[];
}) => {
  const { currentMenu, currentPath } = useMenu();

  const renderButtonColor = (actionName: string) => {
    if (actionName.includes("add")) {
      return "btn-primary";
    }
    if (actionName.includes("print")) {
      return "btn-secondary";
    }
    if (actionName.includes("export")) {
      return "btn-info";
    }
    return "btn-dark";
  };

  const renderIconName = (actionName: string) => {
    if (actionName.includes("add")) {
      return "plus-circle";
    }
    if (actionName.includes("print")) {
      return "printer";
    }
    if (actionName.includes("export")) {
      return "upload";
    }
    return "";
  };

  return (
    <div className="d-flex purchase-pg-btn">
      {!!currentMenu?.action.length &&
        currentMenu.action.map((btn: MenuAction) => {
          const btnColor = renderButtonColor(btn.actionname);
          const iconName = renderIconName(btn.actionname);
          const isModalButton = modalButtons?.includes(btn.actionname);
          return (
            <div className="page-btn d-none d-sm-block" key={btn.actionname}>
              <Link
                href={isModalButton ? "#" : `${currentPath}/new`}
                onClick={() =>
                  isModalButton ? null : handleAction(btn.actionname)
                }
                className={`btn btn-added ${btnColor} ${
                  disabledButtons?.includes(btn.actionname) ? "disabled" : ""
                }`}
              >
                {iconName && <FeatherIcon icon={iconName} />}
                {btn.actiondisplayname}
              </Link>
            </div>
          );
        })}
    </div>
  );
};

export default PageActions;
