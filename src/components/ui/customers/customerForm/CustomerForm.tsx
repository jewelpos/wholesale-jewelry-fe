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
import { CustomerFormType } from "@/types/customer";
import CustomerInputsA from "./CustomerInputsA";
import CustomerInputsB from "./CustomerInputsB";
import CustomerDocumentsSection from "./CustomerDocumentsSection";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import { useQuery } from "@apollo/client";
import PlaceHolder from "../../PlaceHolder";
import { UserRound, Settings } from "lucide-react";
import useWarehouse from "@/hooks/useWarehouse";

const CustomerForm = ({ disableField }: { disableField?: boolean }) => {
  const { customerId } = useParams();
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
    watch,
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
  const status = watch("status");
  const custalert = watch("custalert");
  const photoPath = getValues("custphotopath");
  const customerid = getValues("customerid");
  const [loading, setLoading] = useState(false);

  const { fetchWarehouseByStoreId, warehouses } = useWarehouse();

  useEffect(() => {
    if (parsedStoreId) fetchWarehouseByStoreId(parsedStoreId);
  }, [parsedStoreId, fetchWarehouseByStoreId]);

  // Pre-select default warehouse on new customer only
  useEffect(() => {
    if (customerId || warehouses.length === 0) return;
    const defaultWarehouse = warehouses.find((w) => w.issystem) ?? warehouses[0];
    if (defaultWarehouse) setValue("warehouseid", String(defaultWarehouse.warehouseid));
  }, [warehouses, customerId, setValue]);

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
            `/store/customer/edit`,
            form
          );
        } else {
          response = await api.post(
            `/store/customer/add`,
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
          <div
            style={{
              background: "#f5f6f8",
              borderRadius: 10,
              padding: "20px 20px 8px",
            }}
          >
            <div className="row g-3">
              {/* Left card — profile & contact */}
              <div className="col-lg-6 col-md-12">
                <div
                  className="card h-100 w-100"
                  style={{
                    border: "1px solid #e9ecef",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    className="card-header py-3"
                    style={{
                      background: "#fff",
                      borderBottom: "1px solid #e9ecef",
                      borderLeft: "3px solid #0d6efd",
                    }}
                  >
                    <h6
                      className="mb-0 fw-semibold d-flex align-items-center gap-2"
                      style={{ fontSize: 13, color: "#495057" }}
                    >
                      <UserRound size={14} strokeWidth={2} color="#0d6efd" />
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
                      companyName={watch("custcompanyname")}
                      disableField={disableField}
                    />
                  </div>
                </div>
              </div>

              {/* Right card — account settings */}
              <div className="col-lg-6 col-md-12">
                <div
                  className="card h-100 w-100"
                  style={{
                    border: "1px solid #e9ecef",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    className="card-header py-3"
                    style={{
                      background: "#fff",
                      borderBottom: "1px solid #e9ecef",
                      borderLeft: "3px solid #0d6efd",
                    }}
                  >
                    <h6
                      className="mb-0 fw-semibold d-flex align-items-center gap-2"
                      style={{ fontSize: 13, color: "#495057" }}
                    >
                      <Settings size={14} strokeWidth={2} color="#0d6efd" />
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
                      custalert={custalert}
                      disableField={disableField}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents section — edit mode only (customerid exists) */}
        {parsedCustomerId && !isNaN(parsedCustomerId) && !customerLoading && (
          <div className="container-fluid">
            <CustomerDocumentsSection
              customerid={parsedCustomerId}
              storeid={parsedStoreId}
            />
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
