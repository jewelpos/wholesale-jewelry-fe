"use client";

import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import LabelLoader from "../../LabelLoader";
import PlaceHolder from "../../PlaceHolder";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import useSupplierPayment from "@/hooks/useSupplierPayment";
import SelectPayment from "@/components/forms/SelectPayment";
import SelectSupplier from "@/components/forms/SelectSupplier";
import { VoidPaymentFormType } from "@/types/supplier";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CREATE_SUPPLIER_VOIDED_PAYMENT_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useMutation } from "@apollo/client";

const VoidPaymentForm = ({
  storeId,
  closePaymentModal,
  supplierid: supplierIdProp,
  paymentid: paymentIdProp,
}: {
  storeId: number;
  closePaymentModal: () => void;
  supplierid?: number;
  paymentid?: number;
}) => {
  const dispatch = useAppDispatch();
  const {
    fetchNonVoidedSupplierPaymentTransactionList,
    payments,
    loading: paymentLoading,
    fetchAppliedAmountListBySupplierPaymentId,
    appliedAmounts,
    appliedAmountsLoading,
  } = useSupplierPayment();
  const {
    handleSubmit,
    control,
    trigger,
    formState: { errors, isValid },
    watch,
  } = useForm<VoidPaymentFormType>({
    defaultValues: {
      supplierid: supplierIdProp ?? 0,
      postingdate: dayjs(),
      paymentid: paymentIdProp ?? 0,
    },
    mode: "all",
  });
  const [createSupplierVoidedPayment, { loading: saving }] = useMutation(
    CREATE_SUPPLIER_VOIDED_PAYMENT_MUTATION
  );

  const supplierId = watch("supplierid");
  const paymentId = watch("paymentid");

  const totalAppliedAmount = useMemo(
    () => appliedAmounts.reduce((sum, item) => sum + item.appliedamount, 0),
    [appliedAmounts]
  );

  useEffect(() => {
    // When paymentId changes, fetch related invoices
    if (paymentId) {
      fetchAppliedAmountListBySupplierPaymentId(storeId, paymentId);
    }
  }, [paymentId, fetchAppliedAmountListBySupplierPaymentId, storeId]);

  const onSubmit = async (formData: VoidPaymentFormType) => {
    const payload = {
      storeid: storeId,
      supplierid: formData.supplierid,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      paymentid: formData.paymentid.toString(),
    };

    const result = await handleTryCatch(async () => {
      const response = await createSupplierVoidedPayment({
        variables: { input: payload },
      });
      const { data } = response;
      if (data?.createSupplierVoidedPayment) {
        const successData = data.createSupplierVoidedPayment;
        dispatch(
          showNotification({
            message: successData.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        closePaymentModal();
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Supplier</label>
            {!supplierIdProp ? (
              <>
                <Controller
                  control={control}
                  name="supplierid"
                  rules={{ required: "Supplier is required" }}
                  render={({ field }) => (
                    <SelectSupplier
                      trigger={trigger}
                      storeId={storeId}
                      {...field}
                      onChangeAdditional={(value: number) => {
                        field.onChange(value);
                        if (value) {
                          fetchNonVoidedSupplierPaymentTransactionList(
                            storeId,
                            value
                          );
                        }
                      }}
                    />
                  )}
                />
                {errors.supplierid && (
                  <div className="invalid-feedback d-block">
                    {errors.supplierid.message}
                  </div>
                )}
              </>
            ) : (
              <input
                type="text"
                className="form-control"
                value={appliedAmounts[0]?.companyname || ""}
                disabled
              />
            )}
          </div>
        </div>
      </div>

      <div
        className={
          !paymentLoading &&
          supplierId &&
          (!!payments.length || !!paymentIdProp)
            ? ""
            : "opacity-50 pe-none"
        }
      >
        <div className="row">
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Posting Date" loading={paymentLoading} />
              <Controller
                control={control}
                name="postingdate"
                rules={{ required: "Posting date is required" }}
                render={({ field }) => (
                  <DatePicker
                    suffixIcon={<Calendar size={14} />}
                    format="YYYY-MM-DD"
                    className="form-control"
                    {...field}
                  />
                )}
              />
              {errors.postingdate && (
                <div className="invalid-feedback d-block">
                  {errors.postingdate.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Transaction #" loading={paymentLoading} />
              {paymentIdProp ? (
                <input
                  type="text"
                  className="form-control"
                  value={paymentIdProp}
                  disabled
                />
              ) : (
                <>
                  <Controller
                    control={control}
                    name="paymentid"
                    rules={{ required: "Payment is required" }}
                    render={({ field }) => (
                      <SelectPayment
                        trigger={trigger}
                        storeId={storeId}
                        supplierId={supplierId}
                        hasPayments={true}
                        propsPayments={payments}
                        {...field}
                      />
                    )}
                  />
                  {errors.paymentid && (
                    <div className="invalid-feedback d-block">
                      {errors.paymentid.message}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Amount" loading={appliedAmountsLoading} />
              <input
                type="text"
                className="form-control"
                value={totalAppliedAmount.toFixed(2)}
                disabled
              />
            </div>
          </div>
        </div>
      </div>
      {/* Invoice list table */}
      {appliedAmountsLoading &&
        [1, 2, 3, 4, 5, 6].map((i) => <PlaceHolder key={i} />)}
      {!appliedAmountsLoading && !!paymentId && !!appliedAmounts.length && (
        <div className="modal-body-table">
          <div className="table-responsive">
            <table className="table datanew">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Applied Date</th>
                  <th>Applied Amount</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {appliedAmounts.map((item) => (
                  <tr key={item.appliedamountid}>
                    <td>{item.invoicenumber}</td>
                    <td>
                      {dayjs(Number(item.applieddate)).format(TIME_FORMAT)}
                    </td>
                    <td>${item.appliedamount.toFixed(2)}</td>
                    <td>{item.paymode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Action buttons */}
      {!paymentLoading && !!supplierId && !!appliedAmounts.length && (
        <ActionFooter handleCancel={closePaymentModal}>
          <ButtonLoader
            loading={saving}
            btnText="Void"
            loadingText="Voiding ..."
            disabled={!isValid || saving}
          />
        </ActionFooter>
      )}
    </form>
  );
};

export default VoidPaymentForm;
