"use client";

import React from "react";
import { useMutation } from "@apollo/client";
import { SubmitHandler, useForm } from "react-hook-form";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import OutletInputs from "./OutletInputs";
import OutletContactInputs from "./OutletContactInputs";
import { CREATE_OUTLET_MUTATION } from "@/lib/graphql/mutations/outlet";
import { CreateOutlet } from "@/types/outlet";
import { useParams, useRouter } from "next/navigation";
import ButtonLoader from "../ButtonLoader";

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
        router.push("/jw/home");
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
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Outlet info</h5>
            </div>
            <OutletContactInputs register={register} errors={errors} />
          </div>
        </div>
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Outlet location</h5>
            </div>
            <div className="card-body">
              <OutletInputs
                register={register}
                errors={errors}
                control={control}
                selectedCountry={getValues("country")}
                trigger={trigger}
              />
            </div>
          </div>
          <div className="text-end">
            <ButtonLoader
              loading={loading}
              btnText="Create outlet"
              loadingText="Creating ..."
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateOutletForm;
