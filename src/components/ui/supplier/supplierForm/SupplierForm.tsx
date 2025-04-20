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

  const [createSupplier, { loading: createLoading }] = useMutation(
    ADD_SUPPLIER_MUTATION
  );

  const [editSupplier, { loading: updateLoading }] = useMutation(
    UPDATE_SUPPLIER_MUTATION
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
  const status = getValues("supplierstatus");
  const supplierid = getValues("supplierid");

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const onSubmit: SubmitHandler<SupplierFormType> = async ({
    supplierid,
    ...formData
  }) => {
    let editPayload = {};
    if (supplierId) {
      editPayload = {
        ...editPayload,
        supplierid: supplierId ? Number(supplierid) : null,
      };
    }
    const payload = {
      ...formData,
      supplierstatus: formData.supplierstatus ? 1 : 0,
      ...editPayload,
    };

    const result = await handleTryCatch(async () => {
      let response;
      if (supplierId) {
        response = await editSupplier({
          variables: { input: payload },
        });
      } else {
        response = await createSupplier({
          variables: { input: payload },
        });
      }

      const { data } = response;
      if (data?.createSupplier || data?.editSupplier) {
        const successData = data.createSupplier || data.editSupplier;
        dispatch(
          showNotification({
            message: successData.message,
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

  useEffect(() => {
    if (supplierData?.getSupplierBySupplierId) {
      const { __typename, ...supplier } = supplierData.getSupplierBySupplierId;
      reset({
        ...supplier,
        storeid: parsedStoreId,
        supplierid: supplierId,
      });
    }
  }, [supplierData, parsedStoreId, supplierId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={disableField}>
        <div className="card">
          <div className="card-body">
            {supplierLoading ? (
              [1, 2, 3, 4, 5, 6, 7].map((item) => <PlaceHolder key={item} />)
            ) : (
              <div className="new-employee-field">
                <SupplierInputsA
                  register={register}
                  errors={errors}
                  control={control}
                  trigger={trigger}
                  supplierId={supplierid}
                  disableField={disableField}
                />
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
            )}
          </div>
        </div>
        {!disableField && !supplierLoading && (
          <ActionFooter handleCancel={handleCancel}>
            <ButtonLoader
              loading={createLoading || updateLoading}
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
