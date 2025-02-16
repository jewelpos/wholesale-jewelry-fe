"use client";

import useStores from "@/hooks/useStores";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { CREATE_OUTLET_USER_MUTATION } from "@/lib/graphql/mutations/user";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { AddUserFormType } from "@/types/user";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";

import UserProfileInputs from "./UserProfileInputs";
import UserStoreInputs from "./UserStoreInputs";
import UserOutletInputs from "./UserOutletInputs";
import useOutlets from "@/hooks/useOutlets";
import UserSecurityInputs from "./UserSecurityInputs";

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
    { input: AddUserFormType }
  >(CREATE_OUTLET_USER_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    trigger,
  } = useForm<AddUserFormType>();
  const { fetchStoresData, loading: storesLoading } = useStores();
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  const password = getValues("password");

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

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
      <UserProfileInputs register={register} errors={errors} />
      <UserStoreInputs
        control={control}
        errors={errors}
        storesLoading={storesLoading}
        fetchOutletsList={fetchOutletsList}
      />
      <UserOutletInputs
        control={control}
        errors={errors}
        outlets={outlets}
        outletsLoading={outletsLoading}
      />
      <UserSecurityInputs
        register={register}
        errors={errors}
        password={password}
      />
    </form>
  );
};

export default AddUserForm;
