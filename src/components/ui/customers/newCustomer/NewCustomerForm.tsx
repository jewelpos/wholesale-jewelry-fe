"use client";

import useStores from "@/hooks/useStores";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { NewCustomerFormType } from "@/types/customer";
import { ADD_CUSTOMER_MUTATION } from "@/lib/graphql/mutations/customer";
import CustomerInformationInputs from "./CustomerInformationInputs";
import CustomerAddressInformationInputs from "./CustomerAddressInformationInputs";
import CustomerOtherInformation from "./CustomerOtherInformation";
import dayjs from "dayjs";

type NewCustomerResponse = {
  createCustomer: {
    success: boolean;
    message: string;
    error: string | null;
    data: JSON;
  };
};

const NewCustomerForm = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [createCustomer, { loading }] = useMutation<
    NewCustomerResponse,
    { input: NewCustomerFormType }
  >(ADD_CUSTOMER_MUTATION);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    getValues,
    trigger,
    reset,
    setValue,
  } = useForm<NewCustomerFormType>({
    defaultValues: {
      custcompanyname: "",
      custfname: "",
      custlname: "",
      custadd1: "",
      custadd2: "",
      custcity: "",
      custstate: "",
      custzip: "",
      custcountry: "",
      custtitle: "",
      custphone1: "",
      custphone2: "",
      custphone3: "",
      custfax: "",
      custcell: "",
      custdob: "",
      custtaxid: "",
      custdlno: "",
      custssno: "",
      custremarks: "",
      custalertremarks: "",
      custemailadd: "",
      status: 1,
      termsid: 0,
      custalert: 0,
      custphotopath: "",
      warehouseid: 0,
      custshippingmethod: "",
      custdiscount: 0,
      custcreditlimit: 0,
      custcreditcardno: "",
      custcardexpiry: "",
      custauthorizedname: "",
      custbillto: "",
      custshipto: "",
      custsalestax: 0,
      custtaxexemptid: "",
      storeid: 0,
    },
  });
  const storeId = getValues("storeid");
  const warehouseId = getValues("warehouseid");
  const status = getValues("status");

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const onSubmit: SubmitHandler<NewCustomerFormType> = async (formData) => {
    const payload = {
      ...formData,
      custalert: formData.custalert ? 1 : 0,
      custshippingmethod: formData.custshippingmethod.toString(),
      custdob: dayjs(formData.custdob).format(),
      custcardexpiry: dayjs(formData.custcardexpiry).format(),
      custdiscount: Number(formData.custdiscount),
      custcreditlimit: Number(formData.custcreditlimit),
      custsalestax: Number(formData.custsalestax),
    };
    const result = await handleTryCatch(async () => {
      const { data } = await createCustomer({
        variables: { input: payload },
      });
      if (data?.createCustomer) {
        dispatch(
          showNotification({
            message: data.createCustomer.message,
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
                      errors.custcompanyname && "is-invalid"
                    }  form-control`}
                    {...register("custcompanyname", {
                      required: "Companu name is required",
                    })}
                  />
                  {errors.custcompanyname && (
                    <div className="invalid-feedback">
                      {errors.custcompanyname.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <br></br>
            <CustomerInformationInputs
              register={register}
              errors={errors}
              control={control}
            />
            <CustomerAddressInformationInputs
              register={register}
              errors={errors}
              control={control}
              selectedCountry={getValues("custcountry")}
              trigger={trigger}
            />
            <CustomerOtherInformation
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

export default NewCustomerForm;
