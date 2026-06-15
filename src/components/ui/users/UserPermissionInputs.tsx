"use client";

import { MENU_STATUS_TYPES } from "@/lib/config/constants";
import {
  AddUserMenuAction,
  AddUserMenuChildType,
  AddUserMenusType,
  AddUserMenuType,
} from "@/types/permissions";
import React, { Dispatch, Fragment, SetStateAction } from "react";

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

  const selectAllPermissions = (menu: AddUserMenuType) => {
    const available = menu.children?.filter(
      (p) =>
        p.status === MENU_STATUS_TYPES.SELECTABLE ||
        p.status === MENU_STATUS_TYPES.SELECTED
    ) ?? [];
    const selected = permittedMenus.find(
      (m) => m.permissionid === menu.permissionid
    )?.children ?? [];
    const allSelected =
      available.length > 0 && selected.length === available.length;

    if (allSelected) {
      setPermittedMenus((prev) =>
        prev.filter((m) => m.permissionid !== menu.permissionid)
      );
    } else {
      const exists = permittedMenus.some(
        (m) => m.permissionid === menu.permissionid
      );
      if (exists) {
        setPermittedMenus((prev) =>
          prev.map((m) =>
            m.permissionid === menu.permissionid
              ? { ...m, children: available }
              : m
          )
        );
      } else {
        setPermittedMenus((prev) => [
          ...prev,
          { ...menu, children: available },
        ]);
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
      {menus.map((menu, mIndex) => {
        const available = menu.children?.filter(
          (p) =>
            p.status === MENU_STATUS_TYPES.SELECTABLE ||
            p.status === MENU_STATUS_TYPES.SELECTED
        ) ?? [];
        const selected = permittedMenus.find(
          (m) => m.permissionid === menu.permissionid
        )?.children ?? [];
        const allSelected =
          available.length > 0 && selected.length === available.length;

        return (
          <Fragment key={"user-add-permission-menu-" + mIndex}>
            <div className="row">
              <div className="col-md-3 mb-3">
                <h6 className="mb-1">{menu.permissiondisplayname}</h6>
                {available.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ fontSize: 12 }}
                    onClick={() => selectAllPermissions(menu)}
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>
              <div className="col-md-9">
                {menu.children?.map((perm, pIndex) => {
                  const isPermissionSelected = permittedMenus
                    .find((m) => m.permissionid === menu.permissionid)
                    ?.children?.some(
                      (p) => p.permissionid === perm.permissionid
                    );
                  const isNotAllowed =
                    perm.status === MENU_STATUS_TYPES.NOT_ALLOWED;
                  return (
                    <div
                      className="mb-4"
                      key={`user-add-permission-${perm.permissionid}-${pIndex}`}
                      style={
                        isNotAllowed
                          ? { opacity: 0.45, pointerEvents: "none" }
                          : undefined
                      }
                    >
                      <div className="form-check form-check-md form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id={`flexSwitchCheckDefault-${perm.permissionname}`}
                          disabled={isNotAllowed}
                          checked={!!isPermissionSelected}
                          onChange={() => togglePermission(menu, perm)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`flexSwitchCheckDefault-${perm.permissionname}`}
                        >
                          <span className="d-flex align-items-center gap-2">
                            {perm.permissiondisplayname}
                            {isNotAllowed && (
                              <span
                                className="badge"
                                style={{
                                  fontSize: 10,
                                  background: "#e9ecef",
                                  color: "#6c757d",
                                  fontWeight: 500,
                                }}
                              >
                                Not available
                              </span>
                            )}
                          </span>
                          {perm.permissiondescription && (
                            <p
                              className="mt-1 mb-0 text-muted"
                              style={{ fontSize: 12 }}
                            >
                              {perm.permissiondescription}
                            </p>
                          )}
                        </label>
                      </div>
                      {perm.action?.map((action, aIndex) => {
                        const isActionSelected = permittedMenus
                          .find((m) => m.permissionid === menu.permissionid)
                          ?.children?.find(
                            (p) => p.permissionid === perm.permissionid
                          )
                          ?.action?.some((a) => a.actionid === action.actionid);
                        return (
                          <div
                            className="ms-4 mt-2"
                            key={`user-add-permission-${action.actionid}-${aIndex}`}
                          >
                            <div className="form-check form-check-md form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={`flexSwitchCheckDefault-${action.actionname}`}
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
                                {action.actiondisplayname}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            <hr />
          </Fragment>
        );
      })}
    </>
  );
};

export default UserPermissionInputs;
