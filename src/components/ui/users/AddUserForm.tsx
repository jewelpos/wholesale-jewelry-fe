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
import { AddUserMenusType, AddUserPermissionType, UsersListMenuType } from "@/types/permissions";
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
    // Password/confirm-password use autoComplete="new-password" so Chrome/Edge don't
    // intercept typing — but that same hint is what makes those browsers pop up their
    // "Suggest a strong password" overlay whenever the field receives focus. RHF's
    // default shouldFocusError programmatically focuses the first invalid field after
    // a failed submit, and a programmatic (not user-click) focus on a new-password
    // field is exactly when that overlay tends to appear on top of both fields,
    // blocking clicks/typing — reading as if they'd been disabled. Letting the user
    // click into the field themselves avoids triggering it.
    shouldFocusError: false,
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
  const password = watch("password");
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
    fetchPolicy: 'network-only',
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
      // Assigning a user's outlet access is an admin action — the picker must show every
      // outlet in the store, not just the ones the person doing the assigning can access.
      fetchOutletsList([storeId], true);
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
        roleid: formData.roleid,
      },
      storetooutlet: storeOutlet,
    };

    const result = await handleTryCatch(async () => {
      let response;
      if (userId) {
        response = await editOutletUser({
          variables: { input: { ...payloads, userid: userData?.getUserByIdUnderStore?.userid } },
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
      // Load ALL of this user's outlet assignments, not just the one belonging to
      // the specific list row that was clicked — the list shows one row per
      // outlet, so editing via any single one of them must still see (and
      // resubmit) the user's complete outlet set. Saving with a partial list
      // here silently deletes the outlets that didn't get loaded.
      const allOutlets = user.outlets?.length
        ? user.outlets
        : [{ outletid: user.outletid, outletname: user.outletname, isdefaultoutlet: user.isdefaultoutlet }];
      const defaultOutlet = allOutlets.find((o: { isdefaultoutlet: boolean }) => o.isdefaultoutlet);
      reset({
        emailaddress: user.emailaddress,
        userfullname: user.userfullname,
        userphone: user.userphone,
        outlets: allOutlets.map((o: { outletid: number; outletname: string }) => ({
          value: o.outletid,
          label: o.outletname,
        })),
        roleid: user.roleid,
        storeid: parsedStoreId,
        defaultoutletid: defaultOutlet?.outletid ?? 0,
      });
      // The saved permissions tree is already correctly grouped by storemenu
      // hierarchy (each child's parentid matches its wrapper's menuid) — map it
      // directly instead of re-grouping by permissionparentid, which reflects a
      // different (and sometimes divergent) hierarchy and previously produced
      // mismatched groupings.
      const rawMenus: UsersListMenuType[] = user.userpermissions?.[0]?.menus ?? [];
      const normalizedMenus: AddUserMenusType = rawMenus
        .filter((menu) => (menu.children ?? []).length > 0)
        .map((menu) => ({
          permissionid: menu.permissionid,
          permissiondisplayname: menu.permissiondisplayname ?? '',
          storetypeid: menu.storetypeid,
          children: menu.children.map((c) => ({
            permissionid: c.permissionid,
            permissionname: c.permissionname,
            permissiondisplayname: c.permissiondisplayname,
            permissiondescription: c.permissiondescription ?? '',
            parentid: c.parentid ?? 0,
            storemenuid: c.storemenuid,
            permissionorder: c.permissionorder ?? 0,
            storetypeid: c.storetypeid,
            packageid: c.packageid,
            permissionparentid: c.permissionparentid,
            rolesnotallowed: [],
            action: c.action ?? [],
            status: 'SELECTED' as const,
          })),
        }));
      setPermittedMenus(normalizedMenus);
    }
  }, [reset, userData, parsedStoreId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="row">
        <div className="col-md-12">
          <UserProfileInputs register={register} errors={errors} />
          {userId ? (
            <>
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
                </div>
              </div>
              <UserOutletInputs
                control={control}
                errors={errors}
                outlets={outlets}
                outletsLoading={outletsLoading}
                selectedOutlets={[...selectedOutlets]}
                trigger={trigger}
              />
            </>
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
