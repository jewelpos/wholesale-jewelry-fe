"use client";

import useStores from "@/hooks/useStores";
import { MENU_STATUS_TYPES, NOTIFICATION_TYPES } from "@/lib/config/constants";
import api from "@/lib/axios";

import {
  CREATE_OUTLET_USER_MUTATION,
  EDIT_OUTLET_USER_MUTATION,
} from "@/lib/graphql/mutations/user";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { AddUserFormType } from "@/types/user";
import { useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";

import UserProfileInputs from "./UserProfileInputs";
import UserStoreInputs from "./UserStoreInputs";
import UserOutletInputs from "./UserOutletInputs";
import useOutlets from "@/hooks/useOutlets";
import UserSecurityInputs from "./UserSecurityInputs";
import UserRolesAndPermissionsInputs from "./UserRolesAndPermissionsInputs";
import { RolesType } from "@/types/role";
import { GET_ROLES_QUERY } from "@/lib/graphql/query/role";
import { GET_PERMISSION_QUERY } from "@/lib/graphql/query/permission";
import { AddUserMenusType, AddUserPermissionType } from "@/types/permissions";
import ActionFooter from "../ActionFooter";
import ButtonLoader from "../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { GET_USER_QUERY } from "@/lib/graphql/query/user";

const AddUserForm = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id: userId, storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedUserId = parseInt(userId as string, 10);
  const [createOutletUser, { loading }] = useMutation(
    CREATE_OUTLET_USER_MUTATION
  );
  const [editOutletUser] = useMutation(
    EDIT_OUTLET_USER_MUTATION
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    getValues,
    trigger,
    reset,
    setValue,
    watch,
  } = useForm<AddUserFormType>({
    defaultValues: {
      confirmpassword: "",
      password: "",
      emailaddress: "",
      userfullname: "",
      userphone: "",
      outlets: [],
      roleid: 0,
      storeid: 0,
      defaultoutletid: 0,
    },
  });
  const { fetchStoresData, refetchCurrentStore, loading: storesLoading } = useStores();
  const isNewUser = !userId;
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const password = getValues("password");
  const roleId = getValues("roleid");
  const storeId = getValues("storeid");
  const selectedOutlets = getValues("outlets");
  const { loading: rolesLoading, data: rolesData } = useQuery(GET_ROLES_QUERY);
  const roles: RolesType | undefined = rolesData?.getRoles;
  const { loading: permissionLoading, data: permissionData } = useQuery(
    GET_PERMISSION_QUERY,
    {
      variables: { storeid: storeId, roleid: roleId },
      skip: !roleId || !storeId,
    }
  );
  const { data: userData } = useQuery(GET_USER_QUERY, {
    variables: { id: parsedUserId },
    skip: !parsedUserId,
  });
  const permissions: AddUserPermissionType | undefined =
    permissionData?.getPermissionList?.data[0];
  const menus = permissions?.menus;
  const [permittedMenus, setPermittedMenus] = useState<AddUserMenusType | []>(
    []
  );

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  useEffect(() => {
    if (!isNewUser || !parsedStoreId) return;
    api.post('/store/setup/mark-step', { storeid: parsedStoreId, step: 'users' })
      .then(() => refetchCurrentStore())
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  useEffect(() => {
    if (!getValues("roleid") && roles?.length) {
      setValue("roleid", roles[0].id, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [setValue, getValues, roles]);

  useEffect(() => {
    if (storeId) {
      fetchOutletsList([storeId]);
    }
  }, [storeId, fetchOutletsList]);

  // Pre-select default permissions when role loads (add mode only)
  useEffect(() => {
    if (!menus || userId) return;
    const preSelected: AddUserMenusType = menus
      .map((menu) => ({
        ...menu,
        children: menu.children.filter(
          (p) => p.status === MENU_STATUS_TYPES.SELECTED
        ),
      }))
      .filter((menu) => menu.children.length > 0);
    setPermittedMenus(preSelected);
  }, [menus, userId]);

  const onSubmit: SubmitHandler<AddUserFormType> = async (formData) => {
    const selectedOutlets = formData.outlets.map((outlet) => outlet.value);
    const storeOutlet = {
      storeid: formData.storeid,
      outletids: selectedOutlets,
    };
    const { confirmpassword, storeid, outlets, ...otherPayloads } = formData;
    const payloads = {
      ...otherPayloads,
      permissions: {
        menus: permittedMenus,
        roleid: permissions?.roleid,
      },
      storetooutlet: storeOutlet,
    };

    const result = await handleTryCatch(async () => {
      let response;
      if (userId) {
        response = await editOutletUser({
          variables: { input: { ...payloads, userid: parsedUserId } },
        });
      } else {
        response = await createOutletUser({
          variables: { input: { ...payloads } },
        });
      }
      const { data } = response;
      if (data?.createOutletUser || data?.editOutletUser) {
        const successData = data.createOutletUser || data.editOutletUser;
        dispatch(
          showNotification({
            message: successData.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        router.back();
      }
      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    } else {
      reset();
    }
  };

  useEffect(() => {
    if (userData?.getUserByIdUnderStore) {
      const { __typename, ...user } = userData.getUserByIdUnderStore;
      reset({
        emailaddress: user.emailaddress,
        userfullname: user.userfullname,
        userphone: user.userphone,
        outlets: [
          {
            value: user.outletid,
            label: user.outletname,
          },
        ],
        roleid: user.roleid,
        storeid: parsedStoreId,
      });
      setPermittedMenus(user.userpermissions[0].menus);
    }
  }, [reset, userData, parsedStoreId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-md-12">
          <UserProfileInputs register={register} errors={errors} />
          {userId ? (
            <div className="mb-4">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Store</label>
                    <input
                      type="text"
                      className="form-control"
                      value={userData?.getUserByIdUnderStore?.storename || ""}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Outlet</label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      value={userData?.getUserByIdUnderStore?.outletname || ""}
                      readOnly
                      disabled
                    />
                    {!userData?.getUserByIdUnderStore?.isdefaultoutlet && (
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="makeDefaultOutlet"
                          checked={!!watch("defaultoutletid")}
                          onChange={(e) => {
                            setValue(
                              "defaultoutletid",
                              e.target.checked
                                ? userData?.getUserByIdUnderStore?.outletid || 0
                                : 0,
                              { shouldValidate: true }
                            );
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="makeDefaultOutlet"
                        >
                          Make as default outlet
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <UserStoreInputs
                control={control}
                errors={errors}
                storesLoading={storesLoading}
                setValue={setValue}
                storeId={storeId}
              />
              <UserOutletInputs
                control={control}
                errors={errors}
                outlets={outlets}
                outletsLoading={outletsLoading}
                selectedOutlets={[...selectedOutlets]}
                trigger={trigger}
              />
            </>
          )}
          <UserRolesAndPermissionsInputs
            control={control}
            errors={errors}
            trigger={trigger}
            roles={roles}
            menus={menus}
            rolesLoading={rolesLoading}
            permissionLoading={permissionLoading}
            permittedMenus={permittedMenus}
            setPermittedMenus={setPermittedMenus}
          />
          {!userId && (
            <UserSecurityInputs
              register={register}
              errors={errors}
              password={password}
            />
          )}
        </div>
      </div>
      <ActionFooter handleCancel={handleCancel}>
        <ButtonLoader
          loading={loading}
          btnText="Save"
          loadingText="Saving ..."
        />
      </ActionFooter>
    </form>
  );
};

export default AddUserForm;
