"use client";

import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import ActionFooter from "../../../ActionFooter";
import ButtonLoader from "../../../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { SupplierInvoiceFormType } from "@/types/supplier";
import {
  ADD_SUPPLIER_INVOICE_MUTATION,
  UPDATE_SUPPLIER_INVOICE_MUTATION,
} from "@/lib/graphql/mutations/supplier";
import { useMutation, useQuery } from "@apollo/client";
import { GET_SUPPLIER_INVOICE_QUERY } from "@/lib/graphql/query/supplier";
import SupplierInvoiceFormInputA from "./SupplierInvoiceFormInputA";
import SupplierInvoiceFormInputB from "./SupplierInvoiceFormInputB";
import PlaceHolder from "../../../PlaceHolder";

const SupplierInvoiceForm = ({ disableField }: { disableField?: boolean }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { storeId: storeIdParam, supplierinvoiceid } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedSupplierInvoiceId = parseInt(supplierinvoiceid as string, 10);

  const { data: invoiceData, loading: invoiceLoading } = useQuery(
    GET_SUPPLIER_INVOICE_QUERY,
    {
      variables: {
        storeid: parsedStoreId,
        supplierinvoiceid: parsedSupplierInvoiceId,
      },
      skip: !storeIdParam || !parsedSupplierInvoiceId,
    }
  );

  const [createInvoice, { loading: createLoading }] = useMutation(
    ADD_SUPPLIER_INVOICE_MUTATION
  );

  const [editInvoice, { loading: updateLoading }] = useMutation(
    UPDATE_SUPPLIER_INVOICE_MUTATION
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
  } = useForm<SupplierInvoiceFormType>({
    defaultValues: {
      warehouseid: "",
      supplierid: "",
      veninvoiceno: "",
      refponumber: 0,
      veninvoicedate: "",
      invpostingdate: "",
      termsid: 0,
      storeid: parsedStoreId,
    },
  });

  const storeId = getValues("storeid");
  const warehouseId = getValues("warehouseid");

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const onSubmit: SubmitHandler<SupplierInvoiceFormType> = async ({
    supplierid,
    ...formData
  }) => {
    let editPayload = {};
    if (supplierinvoiceid) {
      editPayload = {
        ...editPayload,
        supplierinvoiceid: supplierinvoiceid ? Number(supplierinvoiceid) : null,
      };
    }
    const payload = {
      ...formData,
      ...editPayload,
    };

    const result = await handleTryCatch(async () => {
      let response;
      if (supplierinvoiceid) {
        response = await editInvoice({
          variables: { input: payload },
        });
      } else {
        response = await createInvoice({
          variables: { input: payload },
        });
      }

      const { data } = response;
      if (data?.createSupplierInvoice || data?.editSupplierInvoice) {
        const successData =
          data.createSupplierInvoice || data.editSupplierInvoice;
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
    if (invoiceData?.getSupplierInvoiceBySupplierInvoiceId) {
      const { __typename, ...invoice } =
        invoiceData.getSupplierInvoiceBySupplierInvoiceId;
      reset({
        ...invoice,
        storeid: parsedStoreId,
      });
    }
  }, [invoiceData, parsedStoreId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={disableField}>
        <div className="card">
          <div className="card-body">
            {invoiceLoading ? (
              [1, 2, 3, 4, 5, 6, 7].map((item) => <PlaceHolder key={item} />)
            ) : (
              <div className="new-employee-field">
                <SupplierInvoiceFormInputA
                  register={register}
                  errors={errors}
                  control={control}
                  trigger={trigger}
                  storeId={storeId}
                  warehouseId={warehouseId}
                  disableField={disableField}
                />
                <SupplierInvoiceFormInputB
                  register={register}
                  errors={errors}
                  control={control}
                  trigger={trigger}
                  setValue={setValue}
                  storeId={storeId}
                  disableField={disableField}
                />
              </div>
            )}
          </div>
        </div>
        {!disableField && !invoiceLoading && (
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

export default SupplierInvoiceForm;
