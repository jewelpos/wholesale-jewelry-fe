"use client";

import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import ActionFooter from "../../../ActionFooter";
import ButtonLoader from "../../../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { useNavigationGuard } from "@/lib/context/NavigationGuardContext";
import { SupplierInvoiceFormType } from "@/types/supplier";
import {
  ADD_SUPPLIER_INVOICE_MUTATION,
  UPDATE_SUPPLIER_INVOICE_MUTATION,
} from "@/lib/graphql/mutations/supplier";
import { useMutation, useQuery } from "@apollo/client";
import { GET_SUPPLIER_INVOICE_QUERY } from "@/lib/graphql/query/supplier";
import SupplierInvoiceFormInputA from "./SupplierInvoiceFormInputA";
import PlaceHolder from "../../../PlaceHolder";
import useSupplier from "@/hooks/useSupplier";
import dayjs from "dayjs";

const SupplierInvoiceForm = ({
  supplierinvoiceid,
  setShowInvoiceFormModal,
  handleRefreshInvoice,
  readOnly,
}: {
  supplierinvoiceid?: number;
  setShowInvoiceFormModal: (value: boolean) => void;
  handleRefreshInvoice?: () => void;
  readOnly?: boolean;
}) => {
  const dispatch = useDispatch();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const parsedOutletId = parseInt(outletIdParam as string, 10);
  const { data: invoiceData, loading: invoiceLoading } = useQuery(
    GET_SUPPLIER_INVOICE_QUERY,
    {
      variables: {
        storeid: parsedStoreId,
        supplierinvoiceid: supplierinvoiceid,
      },
      skip: !storeIdParam || !supplierinvoiceid,
    }
  );
  const { supplier, fetchSupplier, loading: supplierLoading } = useSupplier();
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
      refponumber: "",
      veninvoicedate: dayjs(),
      termsid: 1,
      storeid: parsedStoreId,
      veninvoicetotal: "",
    },
    mode: "all",
  });
  const disableField = !!supplierinvoiceid;

  const supplierId = getValues("supplierid");
  const warehouseId = getValues("warehouseid");
  const savedAmount =
    invoiceData?.getSingleSupplierInvoice?.veninvoicetotal || 0;
  const amountPaid =
    invoiceData?.getSingleSupplierInvoice?.veninvamtpaid ?? null;
  const amountBalance =
    invoiceData?.getSingleSupplierInvoice?.veninvamtbalance ?? null;
  const enteredBy =
    invoiceData?.getSingleSupplierInvoice?.enteredbyname ?? null;
  const lastModified =
    invoiceData?.getSingleSupplierInvoice?.lastmodifieddate ?? null;

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      setShowInvoiceFormModal(false);
    },
  });

  // Registers with the app-wide navigation guard (see NavigationGuardContext.tsx and the
  // identical wiring in CustomerForm.tsx) so leaving this modal open with unsaved changes
  // via a sidebar link asks Save / Discard / Cancel instead of silently losing the entry.
  // This form lives in a modal rather than its own route, so also close the modal on
  // discard — otherwise it would be left open (and stale) behind whatever page the
  // sidebar link navigates to.
  const { registerGuard } = useNavigationGuard();
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  useEffect(() => {
    if (readOnly) return;
    return registerGuard({
      isDirty: () => isDirtyRef.current,
      onSave: () => handleSubmit(onSubmit)(),
      onDiscard: () => {
        reset();
        setShowInvoiceFormModal(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    if (supplierId && parsedStoreId) {
      fetchSupplier(parsedStoreId, Number(supplierId));
    }
  }, [supplierId, parsedStoreId]);

  const onSubmit: SubmitHandler<SupplierInvoiceFormType> = async (formData) => {
    let editPayload = {};
    if (supplierinvoiceid) {
      editPayload = {
        ...editPayload,
        supplierinvoiceid: supplierinvoiceid,
        // Lets the backend verify this edit is happening from the invoice's own
        // outlet (or bypassed for the store owner).
        outletid: parsedOutletId,
      };
    }
    const payload = {
      ...formData,
      ...editPayload,
      refponumber: parseInt(String(formData.refponumber), 10) || 0,
      veninvoicedate: formData.veninvoicedate,
      veninvoicetotal: Number(formData.veninvoicetotal),
      warehouseid: Number(formData.warehouseid),
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
        if (handleRefreshInvoice) {
          handleRefreshInvoice();
        }
        setShowInvoiceFormModal(false);
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
    if (invoiceData?.getSingleSupplierInvoice) {
      const { __typename, ...invoice } = invoiceData.getSingleSupplierInvoice;
      reset({
        warehouseid: invoice.warehouseid,
        supplierid: invoice.supplierid,
        veninvoiceno: invoice.veninvoiceno,
        refponumber: invoice.refponumber != null ? String(invoice.refponumber) : "",
        veninvoicedate: dayjs(invoice.veninvoicedate),
        termsid: invoice.termsid,
        storeid: parsedStoreId,
        veninvoicetotal: invoice.veninvoicetotal.toString(),
      });
    }
  }, [invoiceData, parsedStoreId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={readOnly}>
        {invoiceLoading ? (
          [1, 2, 3, 4, 5, 6, 7].map((item) => <PlaceHolder key={item} />)
        ) : (
          <div className="new-employee-field">
            <SupplierInvoiceFormInputA
              register={register}
              errors={errors}
              control={control}
              trigger={trigger}
              warehouseId={warehouseId}
              disableField={disableField}
              supplier={supplier}
              supplierLoading={supplierLoading}
              storeId={parsedStoreId}
              savedAmount={savedAmount}
              setValue={setValue}
              amountPaid={amountPaid}
              amountBalance={amountBalance}
              enteredBy={enteredBy}
              lastModified={lastModified}
            />
          </div>
        )}
        {!invoiceLoading && (
          readOnly ? (
            <div className="text-end mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInvoiceFormModal(false)}
              >
                Close
              </button>
            </div>
          ) : (
            <ActionFooter handleCancel={handleCancel}>
              <ButtonLoader
                loading={createLoading || updateLoading}
                btnText="Save"
                loadingText="Saving ..."
              />
            </ActionFooter>
          )
        )}
      </fieldset>
    </form>
  );
};

export default SupplierInvoiceForm;
