"use client";

import useStores from "@/hooks/useStores";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { CREATE_OUTLET_USER_MUTATION } from "@/lib/graphql/mutations/user";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { AddUserFormType } from "@/types/user";
import { useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
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
import { AddUserPermissionType, permissions } from "@/types/permissions";
import ActionFooter from "../ActionFooter";
import ButtonLoader from "../ButtonLoader";

type AddUserResponse = {
  createOutletUser: {
    success: boolean;
    message: string;
    error: string | null;
    data: JSON;
  };
};

const AddUserForm = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();
  const router = useRouter();
  const [createOutletUser, { loading }] = useMutation<
    AddUserResponse,
    { input: AddUserFormType }
  >(CREATE_OUTLET_USER_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    trigger,
    resetField,
  } = useForm<AddUserFormType>();
  const { fetchStoresData, loading: storesLoading } = useStores();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const password = getValues("password");
  const roleId = getValues("roleid");
  const storeId = getValues("storeid");
  const { loading: rolesLoading, data: rolesData } = useQuery(GET_ROLES_QUERY);
  const roles: RolesType | undefined = rolesData?.getRoles;
  const { loading: permissionLoading, data: permissionData } = useQuery(
    GET_PERMISSION_QUERY,
    {
      variables: { storeid: storeId, roleid: roleId },
      skip: !roleId || !storeId,
    }
  );
  const permissions: AddUserPermissionType | undefined =
    permissionData?.getPermissionList?.data[0];

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  useEffect(() => {
    if (!getValues("storeid")) {
      fetchOutletsList(parsedStoreId);
      resetField("storeid", { defaultValue: parsedStoreId });
    }
    if (!getValues("roleid") && roles?.length) {
      resetField("roleid", { defaultValue: roles[0].id });
    }
  }, [resetField, parsedStoreId, getValues, roles, fetchOutletsList]);

  const onSubmit: SubmitHandler<AddUserFormType> = async (formData) => {
    const result = await handleTryCatch(async () => {
      const { data } = await createOutletUser({
        variables: { input: formData },
      });
      if (data?.createOutletUser) {
        dispatch(
          showNotification({
            message: data.createOutletUser.message,
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
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-md-8">
          <UserProfileInputs register={register} errors={errors} />
          <UserStoreInputs
            control={control}
            errors={errors}
            storesLoading={storesLoading}
            fetchOutletsList={fetchOutletsList}
            trigger={trigger}
          />
          <UserOutletInputs
            control={control}
            errors={errors}
            outlets={outlets}
            outletsLoading={outletsLoading}
          />
          <UserRolesAndPermissionsInputs
            control={control}
            errors={errors}
            trigger={trigger}
            roles={roles}
            menus={permissions?.menus}
            rolesLoading={rolesLoading}
            register={register}
            permissionLoading={permissionLoading}
          />
          <UserSecurityInputs
            register={register}
            errors={errors}
            password={password}
          />
        </div>
      </div>
      <ActionFooter>
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
