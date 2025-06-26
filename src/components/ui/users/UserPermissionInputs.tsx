"use client";

import { MENU_STATUS_TYPES } from "@/lib/config/constants";
import {
  AddUserMenuAction,
  AddUserMenuChildType,
  AddUserMenusType,
  AddUserMenuType,
} from "@/types/permissions";
import { AddUserFormType, AddUserPermittedMenu } from "@/types/user";
import React, { Dispatch, Fragment, SetStateAction } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  UseFormWatch,
} from "react-hook-form";

interface Props {
  menus: AddUserMenusType;
  permittedMenus: AddUserMenusType;
  setPermittedMenus: Dispatch<SetStateAction<AddUserMenusType>>;
}

const UserPermissionInputs = ({
  menus,
  permittedMenus,
  setPermittedMenus,
}: Props) => {
  if (!menus || menus.length === 0) return null;

  const togglePermission = (
    menu: AddUserMenuType,
    permission: AddUserMenuChildType
  ) => {
    const index = permittedMenus.findIndex(
      (m) => m.permissionid === menu.permissionid
    );
    if (index < 0) {
      setPermittedMenus((prev) => [
        ...prev,
        { ...menu, children: [permission] },
      ]);
    } else {
      const menuIndex = permittedMenus.findIndex(
        (m) => m.permissionid === menu.permissionid
      );
      if (menuIndex === -1) return;
      const permissionIndex = permittedMenus[menuIndex].children?.findIndex(
        (p) => p.permissionid === permission.permissionid
      );
      if (permissionIndex >= 0) {
        let newMenus = permittedMenus.map((m) =>
          m.permissionid === menu.permissionid
            ? {
                ...m,
                children: m.children?.filter(
                  (p) => p.permissionid !== permission.permissionid
                ),
              }
            : m
        );
        newMenus = newMenus.filter((m) => m.children?.length > 0);
        setPermittedMenus(newMenus);
      } else {
        setPermittedMenus((prev) =>
          prev.map((m) =>
            m.permissionid === menu.permissionid
              ? { ...m, children: [...m.children, permission] }
              : m
          )
        );
      }
    }
  };

  const toggleAction = (
    menuId: number,
    permissionId: number,
    action: AddUserMenuAction
  ) => {
    const menu = permittedMenus.find((m) => m.permissionid === menuId);
    const perm = menu?.children?.find((p) => p.permissionid === permissionId);
    if (!perm) return;
    const actionIndex = perm.action?.findIndex(
      (a) => a.actionid === action.actionid
    );
    if (actionIndex >= 0) {
      const newActions = [...perm.action];
      newActions.splice(actionIndex, 1);
      const newPerm = { ...perm, action: newActions };
      setPermittedMenus((prev) =>
        prev.map((m) =>
          m.permissionid === menuId
            ? {
                ...m,
                children: m.children.map((p) =>
                  p.permissionid === permissionId ? newPerm : p
                ),
              }
            : m
        )
      );
    } else {
      const newActions = [...perm.action];
      newActions.push(action);
      const newPerm = { ...perm, action: newActions };
      setPermittedMenus((prev) =>
        prev.map((m) =>
          m.permissionid === menuId
            ? {
                ...m,
                children: m.children.map((p) =>
                  p.permissionid === permissionId ? newPerm : p
                ),
              }
            : m
        )
      );
    }
  };

  return (
    <>
      {menus.map((menu, mIndex) => (
        <Fragment key={"user-add-permission-menu-" + mIndex}>
          <div className="row ">
            <div className="col-md-3 mb-3">
              <h6 className="mb-2">{menu.permissiondisplayname}</h6>
            </div>
            <div className="col-md-1"></div>
            <div className="col-md-8">
              {menu.children?.map((perm) => {
                const isPermissionSelected = permittedMenus
                  .find((m) => m.permissionid === menu.permissionid)
                  ?.children?.some((p) => p.permissionid === perm.permissionid);
                return (
                  <div
                    className="mb-4"
                    key={`user-add-permission-${perm.permissionid}`}
                  >
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-check form-check-md form-switch">
                          <>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id={`flexSwitchCheckDefault-${perm.permissionname}`}
                              disabled={
                                perm.status === MENU_STATUS_TYPES.NOT_ALLOWED
                              }
                              checked={!!isPermissionSelected}
                              onChange={() => togglePermission(menu, perm)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`flexSwitchCheckDefault-${perm.permissionname}`}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                {perm.permissiondisplayname}
                              </div>
                              {perm.permissiondescription && (
                                <p className="mt-1 mb-2">
                                  {perm.permissiondescription}
                                </p>
                              )}
                            </label>
                          </>
                        </div>
                        {perm.action?.map((action) => {
                          const isActionSelected = permittedMenus
                            .find((m) => m.permissionid === menu.permissionid)
                            ?.children?.find(
                              (p) => p.permissionid === perm.permissionid
                            )
                            ?.action?.some(
                              (a) => a.actionid === action.actionid
                            );
                          return (
                            <div
                              className="ms-4 mt-2"
                              key={`user-add-permission-${action.actionid}`}
                            >
                              <div className="row">
                                <div className="col-md-12">
                                  <div className="form-check form-check-md form-switch">
                                    <label className="block text-sm">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        checked={!!isActionSelected}
                                        onChange={() =>
                                          toggleAction(
                                            menu.permissionid,
                                            perm.permissionid,
                                            action
                                          )
                                        }
                                        disabled={!isPermissionSelected}
                                      />
                                      <label
                                        className="form-check-label"
                                        htmlFor={`flexSwitchCheckDefault-${action.actionname}`}
                                      >
                                        <div className="d-flex justify-content-between align-items-center">
                                          {action.actiondisplayname}
                                        </div>
                                      </label>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <hr></hr>
        </Fragment>
      ))}
    </>
  );
};

export default UserPermissionInputs;
