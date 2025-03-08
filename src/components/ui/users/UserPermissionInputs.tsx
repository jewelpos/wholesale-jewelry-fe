"use client";

import { MENU_STATUS_TYPES } from "@/lib/config/constants";
import {
  AddUserMenuAction,
  AddUserMenuChildType,
  AddUserMenusType,
  Menu,
  MenuAction,
  MenuChild,
  Menus,
  permissions,
} from "@/types/permissions";
import { AddUserFormType, AddUserPermittedMenu } from "@/types/user";
import React, { Dispatch, Fragment, SetStateAction } from "react";
import { Control, Controller, UseFormRegister } from "react-hook-form";

interface Props {
  menus: AddUserMenusType;
  permittedMenus: AddUserPermittedMenu[];
  setPermittedMenus: Dispatch<SetStateAction<AddUserPermittedMenu[]>>;
}

interface MenuListProps {
  menus: AddUserMenuChildType[];
  permittedMenus: AddUserPermittedMenu[];
  setPermittedMenus: Dispatch<SetStateAction<AddUserPermittedMenu[]>>;
}

interface ActionListProps {
  actions: AddUserMenuAction[];
}

const renderActionList = (actions: AddUserMenuAction[]) => {
  return actions.map((action) => {
    return (
      <ul className="list-disc" key={`user-add-permission-${action.actionid}`}>
        <li>
          <ul>
            <li>{action.actiondisplayname}</li>
          </ul>
        </li>
      </ul>
    );
  });
};

const checkListLabels = (menu: AddUserMenuChildType) => (
  <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
    {menu.permissiondisplayname}
    <p className="mt-1">{menu.permissiondescription}</p>
    {renderActionList(menu.action)}
  </label>
);

const MenuList = ({
  menus,
  permittedMenus,
  setPermittedMenus,
}: MenuListProps) => {
  const handleEnablePermission = (
    status: boolean,
    permissionid: number,
    permissionparentid: number
  ) => {
    let updatedPermissions: AddUserPermittedMenu[] = [];
    if (status) {
      const newPermission = menus.find(
        (permMenu) =>
          permMenu.permissionid === permissionid &&
          permMenu.parentid === permissionparentid
      );
      if (newPermission) {
        updatedPermissions = [...permittedMenus, newPermission];
      }
    } else {
      updatedPermissions = permittedMenus.filter(
        (permMenu) =>
          !(
            permMenu.permissionid === permissionid &&
            permMenu.parentid === permissionparentid
          )
      );
    }
    setPermittedMenus(updatedPermissions);
  };

  return (
    menus
      // .sort((a, b) => b.permissionorder - a.permissionorder)
      .map((menu) => {
        const isChecked = permittedMenus?.find(
          (permMenu) =>
            permMenu.parentid === menu.parentid &&
            permMenu.permissionid === menu.permissionid
        );
        return (
          <div
            className="mb-4"
            key={`user-add-permission-${menu.permissionid}-${menu.permissionparentid}`}
          >
            <div className="row ">
              <div className="col-md-12">
                <div className="form-check form-check-md form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id={`flexSwitchCheckDefault-${menu.permissionid}-${menu.permissionparentid}`}
                    disabled={menu.status === MENU_STATUS_TYPES.NOT_ALLOWED}
                    checked={!!isChecked}
                    onChange={(e) =>
                      handleEnablePermission(
                        e.target.checked,
                        menu.permissionid,
                        menu.parentid
                      )
                    }
                  />
                  {checkListLabels(menu)}
                </div>
              </div>
            </div>
          </div>
        );
      })
  );
};

const UserPermissionInputs = ({
  menus,
  permittedMenus,
  setPermittedMenus,
}: Props) => {
  return (
    <>
      {menus?.map((menu) => {
        return (
          <Fragment key={"user-add-permission-menu-" + menu.permissionid}>
            <div className="row ">
              <div className="col-md-3 mb-3">
                <h6 className="mb-2">{menu.permissiondisplayname}</h6>
              </div>
              <div className="col-md-1"></div>
              <div className="col-md-8">
                {menu?.children && (
                  <MenuList
                    menus={menu.children}
                    permittedMenus={permittedMenus}
                    setPermittedMenus={setPermittedMenus}
                  />
                )}
              </div>
            </div>
            <hr></hr>
          </Fragment>
        );
      })}
    </>
  );
};

export default UserPermissionInputs;
