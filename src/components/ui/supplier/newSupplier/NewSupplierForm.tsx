"use client";

import useStores from "@/hooks/useStores";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { NewSupplierFormType } from "@/types/supplier";
import { ADD_SUPPLIER_MUTATION } from "@/lib/graphql/mutations/supplier";
import SupplierInformationInputs from "./SupplierInformationInputs";
import SupplierAddressInformationInputs from "./SupplierAddressInformationInputs";
import SupplierOtherInformation from "./SupplierOtherInformation";

type NewCustomerResponse = {
  createSupplier: {
    success: boolean;
    message: string;
    error: string | null;
    data: JSON;
  };
};

const NewSupplierForm = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [createSupplier, { loading }] = useMutation<
    NewCustomerResponse,
    { input: NewSupplierFormType }
  >(ADD_SUPPLIER_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    getValues,
    trigger,
    reset,
    setValue,
  } = useForm<NewSupplierFormType>({
    defaultValues: {
      companyname: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      contactperson1: "",
      phone1: "",
      phone2: "",
      cellphone: "",
      emailaddress: "",
      webaddress: "",
      shippimgmethod: "",
      termsid: 0,
      accountno: "",
      discountrate: 0,
      supplierstatus: 0,
      remarks: "",
      warehouseid: 0,
      supplierfname: "",
      supplierlname: "",
      storeid: parsedStoreId,
    },
  });
  const storeId = getValues("storeid");
  const warehouseId = getValues("warehouseid");
  const status = getValues("supplierstatus");

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const onSubmit: SubmitHandler<NewSupplierFormType> = async (formData) => {
    const payload = {
      ...formData,
      discountrate: Number(formData.discountrate),
    };
    const result = await handleTryCatch(async () => {
      const { data } = await createSupplier({
        variables: { input: payload },
      });
      if (data?.createSupplier) {
        dispatch(
          showNotification({
            message: data.createSupplier.message,
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
      <div className="card">
        <div className="card-body">
          <div className="new-employee-field">
            <div className="row">
              <div className="col-lg-4 col-md-6">
                <div className="mb-3">
                  <label className="form-label">Company name</label>
                  <input
                    type="text"
                    className={`${
                      errors.companyname && "is-invalid"
                    }  form-control`}
                    {...register("companyname", {
                      required: "Company name is required",
                    })}
                  />
                  {errors.companyname && (
                    <div className="invalid-feedback">
                      {errors.companyname.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <br></br>
            <SupplierInformationInputs register={register} errors={errors} />
            <SupplierAddressInformationInputs
              register={register}
              errors={errors}
              control={control}
              selectedCountry={getValues("country")}
              trigger={trigger}
            />
            <SupplierOtherInformation
              register={register}
              errors={errors}
              control={control}
              trigger={trigger}
              setValue={setValue}
              storeId={storeId}
              warehouseId={warehouseId}
              status={status}
            />
          </div>
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

export default NewSupplierForm;
