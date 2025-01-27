"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GetStoreCategoryData, Store, StoreCategory } from "@/types/store";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import Select from "react-select";
import { CREATE_STORE_MUTATION } from "@/lib/graphql/mutations/store";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { emailValidation } from "@/lib/utils/validations/authValidations";
import { errorMessage } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { GET_STORE_CATEGORY_QUERY } from "@/lib/graphql/query/store";

type Props = {};

interface SelectOption {
  value: number;
  label: string;
}

type CreateStoreResponse = {
  createStore: {
    success: boolean;
    message: string;
    error: string | null;
    data: any;
  };
};

const CreateStoreForm = (props: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createStore, { data, loading }] = useMutation<
    CreateStoreResponse,
    { input: Store }
  >(CREATE_STORE_MUTATION);
  const { data: storeCategoryData, loading: storeCategoryLoading } =
    useQuery<GetStoreCategoryData>(GET_STORE_CATEGORY_QUERY);
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<Store>();

  const onSubmit: SubmitHandler<Store> = async (formData) => {
    try {
      const { data } = await createStore({ variables: { input: formData } });
      if (data?.createStore) {
        dispatch(
          showNotification({
            message: data.createStore.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        window.location.href="/jw/admin_dashboard";
        // router.push("/jw/admin_dashboard");
      }
    } catch (error: any) {
      dispatch(
        showNotification({
          message: errorMessage(error),
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Outlet name</label>
            <input
              type="text"
              className={`${errors.outletname && "is-invalid"}  form-control`}
              {...register("outletname", {
                required: "Outlet name is required",
              })}
            />
            {errors.outletname && (
              <div className="invalid-feedback">
                {errors.outletname.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Store category</label>
            <Controller
              name="storetypeid"
              control={control}
              rules={{ required: "Store category is required" }}
              render={({ field }) => (
                <Select<SelectOption>
                  {...field}
                  options={storeCategoryData?.getStoreCategory.map(
                    (category) => ({
                      value: category.id,
                      label: category.name,
                    })
                  )}
                  placeholder="Select store category"
                  isClearable
                  className={`${
                    errors.storetypeid && "is-invalid"
                  }  form-control p-0`}
                  value={
                    field.value
                      ? {
                          value: field.value,
                          label:
                            storeCategoryData?.getStoreCategory.find(
                              (cat) => cat.id === field.value
                            )?.name || "",
                        }
                      : null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
            {errors.storetypeid && (
              <div className="invalid-feedback">
                {errors.storetypeid.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className={`${errors.address && "is-invalid"}  form-control`}
              {...register("address", {
                required: "Address is required",
              })}
            />
            {errors.address && (
              <div className="invalid-feedback">{errors.address.message}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">City</label>
            <input
              type="text"
              className={`${errors.city && "is-invalid"}  form-control`}
              {...register("city", {
                required: "City is required",
              })}
            />
            {errors.city && (
              <div className="invalid-feedback">{errors.city.message}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">State</label>
            <input
              type="text"
              className={`${errors.state && "is-invalid"}  form-control`}
              {...register("state", {
                required: "State is required",
              })}
            />
            {errors.state && (
              <div className="invalid-feedback">{errors.state.message}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Postal code</label>
            <input
              type="text"
              className={`${errors.zipcode && "is-invalid"}  form-control`}
              {...register("zipcode", {
                required: "Postal code is required",
              })}
            />
            {errors.zipcode && (
              <div className="invalid-feedback">{errors.zipcode.message}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Country</label>
            <input
              type="text"
              className={`${errors.country && "is-invalid"}  form-control`}
              {...register("country", {
                required: "Country is required",
              })}
            />
            {errors.country && (
              <div className="invalid-feedback">{errors.country.message}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Phone number</label>
            <input
              type="text"
              className={`${errors.storephone && "is-invalid"}  form-control`}
              {...register("storephone", phoneNumberValidation)}
            />
            {errors.storephone && (
              <div className="invalid-feedback">
                {errors.storephone.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="text"
              className={`${errors.storeemail && "is-invalid"}  form-control`}
              {...register("storeemail", emailValidation)}
            />
            {errors.storeemail && (
              <div className="invalid-feedback">
                {errors.storeemail.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Store person</label>
            <input
              type="text"
              className={`${
                errors.contactperson && "is-invalid"
              }  form-control`}
              {...register("contactperson", {
                required: "Store person name is required",
              })}
            />
            {errors.contactperson && (
              <div className="invalid-feedback">
                {errors.contactperson.message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-end">
        <button type="submit" disabled={loading} className="btn btn-primary">
          Create
        </button>
      </div>
    </form>
  );
};

export default CreateStoreForm;
