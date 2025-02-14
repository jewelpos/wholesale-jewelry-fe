"use client";

import React from "react";
import { useQuery } from "@apollo/client";
import Select from "react-select";
import { Controller } from "react-hook-form";
import { GET_STORE_CATEGORY_QUERY } from "@/lib/graphql/query/store";
import { SelectOption } from "@/types/form";
import { CreateSingleStore, GetStoreCategoryData } from "@/types/store";
import { useMutation } from "@apollo/client";
import { CREATE_SINGLE_STORE_MUTATION } from "@/lib/graphql/mutations/store";
import { SubmitHandler, useForm } from "react-hook-form";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useRouter } from "next/navigation";
import ButtonLoader from "../ButtonLoader";

type CreateStoreResponse = {
  createSingleStore: {
    success: boolean;
    message: string;
    error: string | null;
    data: JSON;
  };
};

const AddStore = () => {
  const {
    data: storeCategoryData,
    loading: storeCategoryLoading,
    error: storeCategoryError,
  } = useQuery<GetStoreCategoryData>(GET_STORE_CATEGORY_QUERY);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [createSingleStore, { loading }] = useMutation<
    CreateStoreResponse,
    CreateSingleStore
  >(CREATE_SINGLE_STORE_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CreateSingleStore>();

  const onSubmit: SubmitHandler<CreateSingleStore> = async ({
    storename,
    categoryid,
  }) => {
    const result = await handleTryCatch(async () => {
      const { data } = await createSingleStore({
        variables: { storename, categoryid },
      });
      if (data?.createSingleStore) {
        dispatch(
          showNotification({
            message: data.createSingleStore.message,
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
    <div className="card-body">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Store name</label>
              <input
                type="text"
                className={`${errors.storename && "is-invalid"}  form-control`}
                {...register("storename", {
                  required: "Store name is required",
                })}
              />
              {errors.storename && (
                <div className="invalid-feedback">
                  {errors.storename.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Store category</label>
              <Controller
                name="categoryid"
                control={control}
                rules={{ required: "Store category is required" }}
                render={({ field }) => (
                  <Select<SelectOption>
                    {...field}
                    isLoading={storeCategoryLoading}
                    options={storeCategoryData?.getStoreCategory.map(
                      (category) => ({
                        value: category.id,
                        label: category.name,
                      })
                    )}
                    placeholder="Select store category"
                    isClearable
                    className={`${
                      errors.categoryid && "is-invalid"
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
              {errors.categoryid && (
                <div className="invalid-feedback">
                  {errors.categoryid.message}
                </div>
              )}
              {storeCategoryError && (
                <div className="invalid-feedback">
                  Store categories are not available
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-end">
          <ButtonLoader
            loading={loading}
            btnText="Create store"
            loadingText="Creating ..."
          />
        </div>
      </form>
    </div>
  );
};

export default AddStore;
