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
import { SupplierFormType } from "@/types/supplier";
import {
  ADD_SUPPLIER_MUTATION,
  UPDATE_SUPPLIER_MUTATION,
} from "@/lib/graphql/mutations/supplier";
import { useMutation, useQuery } from "@apollo/client";
import { GET_SUPPLIER_QUERY } from "@/lib/graphql/query/supplier";
import SupplierInputsA from "./SupplierInputsA";
import SupplierInputsB from "./SupplierInputsB";
import PlaceHolder from "../../PlaceHolder";
import { Truck, Settings } from "lucide-react";
import useWarehouse from "@/hooks/useWarehouse";

const SupplierForm = ({ disableField }: { disableField?: boolean }) => {
  const { supplierId } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedSupplierId = parseInt(supplierId as string, 10);

  const { data: supplierData, loading: supplierLoading } = useQuery(
    GET_SUPPLIER_QUERY,
    {
      variables: { storeid: parsedStoreId, supplierid: parsedSupplierId },
      skip: !storeIdParam || !supplierId,
    }
  );

  const [createSupplier, { loading: createLoading }] = useMutation(ADD_SUPPLIER_MUTATION);
  const [editSupplier, { loading: updateLoading }] = useMutation(UPDATE_SUPPLIER_MUTATION);

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
  } = useForm<SupplierFormType>({
    defaultValues: {
      companyname: "",
      address1: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      contactperson1: "",
      phone1: "",
      cellphone: "",
      emailaddress: "",
      webaddress: "",
      supplierstatus: 1,
      storeid: parsedStoreId,
      warehouseid: "",
      accountno: "",
      termsid: 0,
      shippimgmethod: "",
      remarks: "",
      supplierid: "",
    },
  });

  const storeId = getValues("storeid");
  const warehouseId = getValues("warehouseid");
  const status = watch("supplierstatus");
  const supplierid = getValues("supplierid");
  const [loading, setLoading] = useState(false);

  const { fetchWarehouseByStoreId, warehouses } = useWarehouse();

  useEffect(() => {
    if (parsedStoreId) fetchWarehouseByStoreId(parsedStoreId);
  }, [parsedStoreId, fetchWarehouseByStoreId]);

  // Pre-select default warehouse on new supplier only
  useEffect(() => {
    if (supplierId || warehouses.length === 0) return;
    const defaultWarehouse = warehouses.find((w) => w.issystem) ?? warehouses[0];
    if (defaultWarehouse) setValue("warehouseid", String(defaultWarehouse.warehouseid));
  }, [warehouses, supplierId, setValue]);

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const onSubmit: SubmitHandler<SupplierFormType> = async ({
    supplierid: sid,
    ...formData
  }) => {
    setLoading(true);
    let editPayload = {};
    if (supplierId) {
      editPayload = { supplierid: supplierId ? Number(sid) : null };
    }
    const payload = {
      ...formData,
      supplierstatus: formData.supplierstatus ? 1 : 0,
      warehouseid: formData.warehouseid ? Number(formData.warehouseid) : null,
      shippimgmethod: formData.shippimgmethod ? Number(formData.shippimgmethod) : null,
      ...editPayload,
    };

    const result = await handleTryCatch(async () => {
      let response;
      if (supplierId) {
        response = await editSupplier({ variables: { input: payload } });
      } else {
        response = await createSupplier({ variables: { input: payload } });
      }
      const { data } = response;
      if (data?.createSupplier || data?.editSupplier) {
        const successData = data.createSupplier || data.editSupplier;
        dispatch(
          showNotification({ message: successData.message, type: NOTIFICATION_TYPES.SUCCESS })
        );
        router.back();
      }
      return true;
    });

    setLoading(false);
    if (result.error) {
      dispatch(
        showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR })
      );
    } else {
      reset();
    }
  };

  useEffect(() => {
    if (supplierData?.getSupplierBySupplierId) {
      const { __typename, ...supplier } = supplierData.getSupplierBySupplierId;
      reset({ ...supplier, storeid: parsedStoreId, supplierid: supplierId });
    }
  }, [supplierData, parsedStoreId, supplierId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={disableField}>
        {supplierLoading ? (
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
              padding: "0 0 8px",
            }}
          >
            <div className="row g-3">
              {/* Left card — supplier profile & contact */}
              <div className="col-lg-6 col-md-12">
                <div
                  className="card h-100 w-100"
                  style={{
                    border: "1px solid #e9ecef",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    className="card-header d-flex align-items-center gap-2 py-2"
                    style={{
                      background: "#f8f9ff",
                      borderBottom: "1px solid #f1f5f9",
                      borderLeft: "3px solid #0d6efd",
                    }}
                  >
                    <Truck size={14} strokeWidth={2} color="#0d6efd" />
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Supplier Profile
                    </span>
                  </div>
                  <div className="card-body">
                    <SupplierInputsA
                      register={register}
                      errors={errors}
                      control={control}
                      trigger={trigger}
                      supplierId={supplierid}
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
                    className="card-header d-flex align-items-center gap-2 py-2"
                    style={{
                      background: "#f8f9ff",
                      borderBottom: "1px solid #f1f5f9",
                      borderLeft: "3px solid #0d6efd",
                    }}
                  >
                    <Settings size={14} strokeWidth={2} color="#0d6efd" />
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Account Settings
                    </span>
                  </div>
                  <div className="card-body">
                    <SupplierInputsB
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
          </div>
        )}

        {!disableField && !supplierLoading && (
          <ActionFooter handleCancel={handleCancel}>
            <ButtonLoader
              loading={loading || createLoading || updateLoading}
              btnText="Save"
              loadingText="Saving ..."
            />
          </ActionFooter>
        )}
      </fieldset>
    </form>
  );
};

export default SupplierForm;
