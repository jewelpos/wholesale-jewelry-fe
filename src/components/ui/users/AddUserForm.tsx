"use client";

import useStores from "@/hooks/useStores";
import { MENU_STATUS_TYPES, NOTIFICATION_TYPES } from "@/lib/config/constants";
import { CREATE_OUTLET_USER_MUTATION } from "@/lib/graphql/mutations/user";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { AddUserFormType, AddUserPermittedMenu } from "@/types/user";
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
import { AddUserPermissionType } from "@/types/permissions";
import ActionFooter from "../ActionFooter";
import ButtonLoader from "../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { useAppSelector } from "@/lib/store/hook";
import { SelectOption } from "@/types/form";

type AddUserResponse = {
  createOutletUser: {
    success: boolean;
    message: string;
    error: string | null;
    data: JSON;
  };
};

const AddUserForm = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [createOutletUser, { loading }] = useMutation<
    AddUserResponse,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { input: AddUserFormType | any }
  >(CREATE_OUTLET_USER_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    getValues,
    trigger,
    reset,
    setValue,
  } = useForm<AddUserFormType>({
    defaultValues: {
      confirmpassword: "",
      password: "",
      emailaddress: "",
      permissions: {},
      userfullname: "",
      userphone: "",
      outlets: [],
      roleid: 0,
      storeid: 0,
    },
  });
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
  const menus = permissions?.menus;
  const [permittedMenus, setPermittedMenus] = useState<
    AddUserPermittedMenu[] | []
  >([]);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  useEffect(() => {
    if (menus?.length) {
      const customMenus: AddUserPermittedMenu[] = [];
      menus.forEach((menu) => {
        if (menu.children.length) {
          menu.children.map(({ parentid, permissionid, status }) => {
            if (
              status !== MENU_STATUS_TYPES.NOT_ALLOWED &&
              status !== MENU_STATUS_TYPES.SELECTABLE
            ) {
              customMenus.push({
                parentid,
                permissionid,
              });
            }
          });
        }
      });
      setPermittedMenus(customMenus);
    }
  }, [menus]);

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
  }, [storeId]);

  const onSubmit: SubmitHandler<AddUserFormType> = async (formData) => {
    const updatedMenus = menus?.map((menu) => {
      return {
        ...menu,
        children: menu.children.filter((child) =>
          permittedMenus.find(
            (permMenu) =>
              permMenu.parentid === child.parentid &&
              permMenu.permissionid === child.permissionid
          )
        ),
      };
    });
    const selectedOutlets = formData.outlets.map((outlet) => outlet.value);
    const storeOutlet = {
      storeid: formData.storeid,
      outletids: selectedOutlets,
    };
    const { confirmpassword, storeid, outlets, ...otherPayloads } = formData;
    const payloads = {
      ...otherPayloads,
      permissions: {
        menus: updatedMenus,
        roleid: permissions?.roleid,
      },
      storetooutlet: storeOutlet,
    };

    const result = await handleTryCatch(async () => {
      const { data } = await createOutletUser({
        variables: { input: payloads },
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
    } else {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-md-12">
          <UserProfileInputs register={register} errors={errors} />
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
          />
          <UserRolesAndPermissionsInputs
            control={control}
            errors={errors}
            trigger={trigger}
            roles={roles}
            menus={menus}
            rolesLoading={rolesLoading}
            register={register}
            permissionLoading={permissionLoading}
            permittedMenus={permittedMenus}
            setPermittedMenus={setPermittedMenus}
          />
          <UserSecurityInputs
            register={register}
            errors={errors}
            password={password}
          />
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
