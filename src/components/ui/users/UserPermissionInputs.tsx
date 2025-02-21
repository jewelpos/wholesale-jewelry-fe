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
import { AddUserFormType } from "@/types/user";
import React, { Dispatch } from "react";
import { Control, Controller, UseFormRegister } from "react-hook-form";

interface Props {
  menus: AddUserMenusType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<AddUserFormType>;
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

const renderMenuList = (
  children: AddUserMenuChildType[],
  control: Control<AddUserFormType>
) => {
  return (
    children
      // .sort((a, b) => b.permissionorder - a.permissionorder)
      .map((menu) => {
        return (
          <div
            className="mb-4"
            key={`user-add-permission-${menu.permissionid}-${menu.permissionparentid}`}
          >
            <div className="row ">
              <div className="col-md-12">
                <div className="form-check form-check-md form-switch">
                  <Controller
                    name="menus"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="flexSwitchCheckDefault"
                          disabled={
                            menu.status === MENU_STATUS_TYPES.NOT_ALLOWED
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="flexSwitchCheckDefault"
                        >
                          {menu.permissiondisplayname}
                          <p className="mt-1">{menu.permissiondescription}</p>
                          {renderActionList(menu.action)}
                        </label>
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })
  );
};

const UserPermissionInputs = ({ menus, control }: Props) => {
  return (
    <>
      {menus?.map((menu) => {
        return (
          <>
            <div
              className="row "
              key={"user-add-permission-menu-" + menu.permissionid}
            >
              <div className="col-md-3 mb-3">
                <h6 className="mb-2">{menu.permissiondisplayname}</h6>
              </div>
              <div className="col-md-1"></div>
              <div className="col-md-8">
                {menu?.children && renderMenuList(menu.children, control)}
              </div>
            </div>
            <hr></hr>
          </>
        );
      })}
    </>
  );
};

export default UserPermissionInputs;
