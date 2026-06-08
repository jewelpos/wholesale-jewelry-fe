"use client";

import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import { CustomerFormType } from "@/types/customer";
import CustomerInputsA from "./CustomerInputsA";
import CustomerInputsB from "./CustomerInputsB";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { useQuery } from "@apollo/client";
import PlaceHolder from "../../PlaceHolder";

const CustomerForm = ({ disableField }: { disableField?: boolean }) => {
  const { customerId } = useParams();
  const config = getEnvironmentConfig();
  const dispatch = useDispatch();
  const router = useRouter();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedCustomerId = parseInt(customerId as string, 10);
  const { data: customerData, loading: customerLoading } = useQuery(
    GET_CUSTOMER_QUERY,
    {
      variables: { storeid: parsedStoreId, customerid: parsedCustomerId },
      skip: !storeIdParam || !customerId,
    }
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
  } = useForm<CustomerFormType>({
    defaultValues: {
      custcompanyname: "",
      custadd1: "",
      custcity: "",
      custstate: "",
      custzip: "",
      custcountry: "",
      custphone1: "",
      custcell: "",
      custemailadd: "",
      custfname: "",
      custlname: "",
      custphone2: "",
      storeid: parsedStoreId,
      warehouseid: "",
      custdiscount: 0,
      custcreditlimit: 0,
      termsid: 0,
      custshippingmethod: "",
      custbillto: "",
      custshipto: "",
      custtaxid: "",
      custsalestax: 0,
      status: 1,
      custremarks: "",
      custalertremarks: "",
      custphotopath: "",
      file: null,
      customerid: "",
      custalert: 0,
    },
  });
  const storeId = getValues("storeid");
  const warehouseId = getValues("warehouseid");
  const status = getValues("status");
  const photoPath = getValues("custphotopath");
  const customerid = getValues("customerid");
  const [loading, setLoading] = useState(false);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const onSubmit: SubmitHandler<CustomerFormType> = async (formData) => {
    setLoading(true);
    let updatedParams = {};
    if (formData?.file) {
      updatedParams = {
        ...updatedParams,
        file: formData?.file,
      };
    }
    if (customerId) {
      updatedParams = {
        ...updatedParams,
        customerid: Number(formData.customerid),
      };
    }
    const { file, customerid, ...rest } = formData;
    const payload = {
      ...rest,
      custshippingmethod: formData.custshippingmethod.toString(),
      custdiscount: Number(formData.custdiscount),
      custcreditlimit: Number(formData.custcreditlimit),
      custsalestax: Number(formData.custsalestax),
      warehouseid: Number(formData.warehouseid),
      ...updatedParams,
      custphotopath: "",
    };
    const form = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(payload).forEach(([key, value]: [string, any]) => {
      form.append(key, value);
    });
    const result = await handleTryCatch(
      async () => {
        let response;
        if (customerId) {
          response = await api.put(
            `${config.apiUrl}/store/customer/edit`,
            form
          );
        } else {
          response = await api.post(
            `${config.apiUrl}/store/customer/add`,
            form
          );
        }
        const { data } = response;
        if (data.success) {
          dispatch(
            showNotification({
              message: data.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          router.back();
        }
        return true;
      },
      () => {
        setLoading(false);
      }
    );

    if (result.error) {
      setLoading(false);
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
    if (customerData?.getCustomer) {
      const customer = customerData.getCustomer;
      reset({
        ...customer,
        storeid: parsedStoreId,
        custdiscount: customer.custdiscount.toString(),
        custcreditlimit: customer.custcreditlimit.toString(),
        custsalestax: customer.custsalestax.toString(),
        warehouseid: customer.warehouseid,
        customerid: customerId,
      });
    }
  }, [customerData, parsedStoreId, customerId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={disableField}>
        {customerLoading ? (
          <div className="card">
            <div className="card-body">
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <PlaceHolder key={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="row g-3 align-items-start">
            {/* Left card — profile & contact */}
            <div className="col-lg-6 col-md-12">
              <div className="card h-100" style={{ border: "1px solid #e9ecef" }}>
                <div
                  className="card-header py-3"
                  style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}
                >
                  <h6 className="mb-0 fw-semibold" style={{ fontSize: 13, color: "#495057" }}>
                    Customer Profile
                  </h6>
                </div>
                <div className="card-body">
                  <CustomerInputsA
                    register={register}
                    errors={errors}
                    control={control}
                    trigger={trigger}
                    setValue={setValue}
                    photoPath={photoPath}
                    customerId={customerid}
                    disableField={disableField}
                  />
                </div>
              </div>
            </div>

            {/* Right card — account settings */}
            <div className="col-lg-6 col-md-12">
              <div className="card h-100" style={{ border: "1px solid #e9ecef" }}>
                <div
                  className="card-header py-3"
                  style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}
                >
                  <h6 className="mb-0 fw-semibold" style={{ fontSize: 13, color: "#495057" }}>
                    Account Settings
                  </h6>
                </div>
                <div className="card-body">
                  <CustomerInputsB
                    register={register}
                    errors={errors}
                    control={control}
                    trigger={trigger}
                    setValue={setValue}
                    storeId={storeId}
                    warehouseId={warehouseId}
                    status={status}
                    disableField={disableField}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!disableField && !customerLoading && (
          <ActionFooter handleCancel={handleCancel}>
            <ButtonLoader
              loading={loading}
              btnText="Save"
              loadingText="Saving ..."
            />
          </ActionFooter>
        )}
      </fieldset>
    </form>
  );
};

export default CustomerForm;
