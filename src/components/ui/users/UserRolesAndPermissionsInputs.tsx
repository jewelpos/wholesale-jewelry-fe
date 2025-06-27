"use client";

import { AddUserFormType, AddUserPermittedMenu } from "@/types/user";
import React, { Dispatch, SetStateAction } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";
import { SelectOption } from "@/types/form";
import Select from "react-select";
import { RolesType } from "@/types/role";
import { AddUserMenusType } from "@/types/permissions";
import UserPermissionInputs from "./UserPermissionInputs";
import PlaceHolder from "../PlaceHolder";
import { register } from "module";

interface Props {
  errors: FieldErrors<AddUserFormType>;
  control: Control<AddUserFormType>;
  trigger: UseFormTrigger<AddUserFormType>;
  roles: RolesType | undefined;
  menus: AddUserMenusType | undefined;
  rolesLoading: boolean;
  register: UseFormRegister<AddUserFormType>;
  permissionLoading: boolean;
  permittedMenus: AddUserMenusType;
  setPermittedMenus: Dispatch<SetStateAction<AddUserMenusType>>;
}

const UserRolesAndPermissionsInputs = ({
  errors,
  control,
  trigger,
  roles,
  menus,
  rolesLoading,
  permissionLoading,
  permittedMenus,
  setPermittedMenus,
}: Props) => {
  return (
    <div className="card table-list-card">
      <div className="card-body mb-4 mb-4 mt-4">
        <div className="row">
          <div className="col-md-5 mb-3">
            <h4 className="mb-2">Roles and Permissions</h4>
            <p>A role defines what this user can see and do.</p>
          </div>
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Roles</label>
              <Controller
                name="roleid"
                control={control}
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <Select<SelectOption>
                    {...field}
                    isLoading={rolesLoading}
                    options={roles?.map((role) => ({
                      value: role.id,
                      label: role.name,
                    }))}
                    placeholder="Select an outlet"
                    isClearable={roles && roles?.length > 1}
                    className={`${
                      errors.roleid && "is-invalid"
                    }  form-control p-0`}
                    value={
                      field.value
                        ? {
                            value: field.value,
                            label:
                              roles?.find((role) => role.id === field.value)
                                ?.name || "",
                          }
                        : null
                    }
                    onChange={(option) => {
                      field.onChange(option?.value);
                      trigger("roleid");
                    }}
                  />
                )}
              />
              {errors.roleid && (
                <div className="invalid-feedback">{errors.roleid.message}</div>
              )}
            </div>
          </div>
        </div>
        <hr></hr>
        {permissionLoading && (
          <>
            <PlaceHolder />
            <PlaceHolder />
            <PlaceHolder />
            <PlaceHolder />
            <PlaceHolder />
          </>
        )}

        {!permissionLoading && menus && permittedMenus && (
          <UserPermissionInputs
            menus={menus}
            permittedMenus={permittedMenus}
            setPermittedMenus={setPermittedMenus}
          />
        )}
      </div>
    </div>
  );
};

export default UserRolesAndPermissionsInputs;
