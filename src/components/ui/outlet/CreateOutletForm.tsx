"use client";

import React, { useEffect } from "react";
import { useMutation } from "@apollo/client";
import { SubmitHandler, useForm } from "react-hook-form";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { CREATE_OUTLET_MUTATION } from "@/lib/graphql/mutations/outlet";
import { CreateOutlet } from "@/types/outlet";
import { useParams, useRouter } from "next/navigation";
import ButtonLoader from "../ButtonLoader";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import useStores from "@/hooks/useStores";
import OutletFormTypeA from "./OutletFormTypeA";
import OutletFormTypeB from "./OutletFormTypeB";
import OutletFormTypeC from "./OutletFormTypeC";
import OutletFormTypeD from "./OutletFormTypeD";
import ActionFooter from "../ActionFooter";

type CreateOutletResponse = {
  createOutlet: {
    success: boolean;
    message: string;
    error: string | null;
    data: JSON;
  };
};

const CreateOutletForm = () => {
  const { storeId } = useParams();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const parsedStoreId = parseInt(storeId as string, 10);
  const [createOutlet, { loading }] = useMutation<
    CreateOutletResponse,
    { input: CreateOutlet }
  >(CREATE_OUTLET_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    trigger,
  } = useForm<CreateOutlet>({
    defaultValues: { storeid: parsedStoreId },
  });

  const { homePagePath } = useDefaultRoute();
  const { fetchStoresData, loading: storesLoading } = useStores();

  const onSubmit: SubmitHandler<CreateOutlet> = async (formData) => {
    const result = await handleTryCatch(async () => {
      const { data } = await createOutlet({ variables: { input: formData } });
      if (data?.createOutlet) {
        dispatch(
          showNotification({
            message: data.createOutlet.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        router.push(homePagePath);
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

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <OutletFormTypeA
        errors={errors}
        control={control}
        storesLoading={storesLoading}
      />
      <OutletFormTypeB register={register} errors={errors} />
      <OutletFormTypeC register={register} errors={errors} />
      <OutletFormTypeD
        register={register}
        errors={errors}
        control={control}
        selectedCountry={getValues("country")}
        trigger={trigger}
      />
      <ActionFooter handleCancel={() => router.back()}>
        <ButtonLoader
          loading={loading}
          btnText="Create outlet"
          loadingText="Creating ..."
        />
      </ActionFooter>
    </form>
  );
};

export default CreateOutletForm;
