"use client";

import React from "react";
import { CreateStore } from "@/types/store";
import { useMutation } from "@apollo/client";
import { CREATE_STORE_MUTATION } from "@/lib/graphql/mutations/store";
import { SubmitHandler, useForm } from "react-hook-form";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import StoreInputs from "./StoreInputs";
import OutletInputs from "../outlet/OutletInputs";
import OutletContactInputs from "../outlet/OutletContactInputs";
import ButtonLoader from "../ButtonLoader";
import { useRouter } from "next/navigation";

type CreateStoreResponse = {
  createStore: {
    success: boolean;
    message: string;
    error: string | null;
    data: JSON;
  };
};

const CreateStoreOutletForm = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [createStore, { loading }] = useMutation<
    CreateStoreResponse,
    { input: CreateStore }
  >(CREATE_STORE_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    trigger,
  } = useForm<CreateStore>();

  const onSubmit: SubmitHandler<CreateStore> = async (formData) => {
    const result = await handleTryCatch(async () => {
      const { data } = await createStore({ variables: { input: formData } });
      if (data?.createStore) {
        dispatch(
          showNotification({
            message: data.createStore.message,
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
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Store info</h5>
                </div>
                <StoreInputs
                  register={register}
                  errors={errors}
                  control={control}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Outlet info</h5>
                </div>
                <OutletContactInputs register={register} errors={errors} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
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
              btnText="Create store"
              loadingText="Creating ..."
            />
          </div>
        </div>
      </div>
      <div className="p-3 d-flex justify-content-end">
        <button type="button" className="btn btn-light me-2">
          Cancel
        </button>
        <ButtonLoader
          loading={loading}
          btnText="Create store"
          loadingText="Creating ..."
        />
      </div>
    </form>
  );
};

export default CreateStoreOutletForm;
