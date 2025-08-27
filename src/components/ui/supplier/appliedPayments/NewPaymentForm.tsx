"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import useSupplier from "@/hooks/useSupplier";
import { NewPaymentFormType } from "@/types/supplier";
import { CREATE_SUPPLIER_NEW_PAYMENT_MUTATION } from "@/lib/graphql/mutations/supplier";
import { useMutation } from "@apollo/client";
import { useDispatch } from "react-redux";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import SelectSupplier from "@/components/forms/SelectSupplier";
import { Calendar } from "react-feather";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import SelectSupplierInvoice from "@/components/forms/SelectSupplierInvoice";
import PlaceHolder from "../../PlaceHolder";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import LabelLoader from "../../LabelLoader";
import { handleKeyDownAllowNumberOnly } from "@/lib/utils/utils";
import { TIME_FORMAT } from "@/lib/config/constants";

const NewPaymentForm = ({
  storeId,
  closePaymentModal,
  outletId,
}: {
  storeId: number;
  closePaymentModal: () => void;
  outletId: number;
}) => {
  const {
    fetchSupplierBalanceDue,
    supplierBalanceDue,
    loading: invoiceLoading,
  } = useSupplier();
  const {
    handleSubmit,
    control,
    trigger,
    formState: { errors, isValid },
    register,
    getValues,
    watch,
  } = useForm<NewPaymentFormType>({
    defaultValues: {
      supplierid: 0,
      postingdate: dayjs(),
      paymentmodeid: 0,
      checkcardno: "",
      amount: "",
      invoicenumber: "",
      reference: "",
    },
    mode: "all",
  });
  const supplierId = getValues("supplierid");
  const [autoApply, setAutoApply] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const dispatch = useDispatch();
  const [createPayment, { loading: saving }] = useMutation(
    CREATE_SUPPLIER_NEW_PAYMENT_MUTATION
  );

  const amountValue = Number(watch("amount") || 0);
  const selectedInvoiceNo = watch("invoicenumber");

  const { allocations, unappliedAmount } = useMemo(() => {
    let remaining = amountValue;
    const allocArr: number[] = [];

    if (autoApply && amountValue > 0) {
      if (selectedInvoiceNo) {
        // Apply only to the selected invoice row
        supplierBalanceDue.forEach((row) => {
          if (row.veninvoiceno === selectedInvoiceNo && remaining > 0) {
            const applied = Math.min(row.veninvamtbalance, remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      } else {
        // Sequentially apply across all invoices
        supplierBalanceDue.forEach((row) => {
          if (remaining > 0) {
            const applied = Math.min(row.veninvamtbalance, remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      }
    } else {
      // Auto-apply disabled – nothing allocated
      supplierBalanceDue.forEach(() => allocArr.push(0));
    }

    return {
      allocations: allocArr,
      unappliedAmount: autoApply ? remaining : amountValue,
    };
  }, [autoApply, amountValue, supplierBalanceDue, selectedInvoiceNo]);

  const onSubmit = async (formData: NewPaymentFormType) => {
    const payload = {
      storeid: storeId,
      supplierid: formData.supplierid,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      paymentmodeid: formData.paymentmodeid,
      chequecardno: formData.checkcardno,
      chequeamount: Number(formData.amount),
      invoicenumbers: formData.invoicenumber ? [formData.invoicenumber] : [],
      reference: formData.reference,
    };

    const result = await handleTryCatch(async () => {
      const response = await createPayment({ variables: { input: payload } });
      const { data } = response;
      if (data?.createSupplierNewPayment) {
        const successData = data.createSupplierNewPayment;
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
        <div className="col-lg-5 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Supplier</label>
            <Controller
              name="supplierid"
              control={control}
              rules={{ required: "Supplier is required" }}
              render={({ field }) => (
                <SelectSupplier
                  className={`${errors.supplierid && "is-invalid"} `}
                  trigger={trigger}
                  storeId={storeId}
                  {...field}
                  onChangeAdditional={(value: string) => {
                    field.onChange(value);
                    if (value) {
                      fetchSupplierBalanceDue(
                        storeId,
                        outletId,
                        parseInt(value)
                      );
                    }
                  }}
                />
              )}
            />
            {errors.supplierid && (
              <div className="invalid-feedback">
                {errors.supplierid.message}
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={
          !invoiceLoading && supplierId && !!supplierBalanceDue.length
            ? ""
            : "opacity-50 pe-none"
        }
      >
        <div className="row">
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Posting Date" loading={invoiceLoading} />
              <div className="input-groupicon calender-input">
                <Calendar className="info-img" />
                <Controller
                  name="postingdate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      onChange={(date) => field.onChange(date)}
                      value={field.value}
                      format="YYYY-MM-DD"
                      allowClear={false}
                    />
                  )}
                />
              </div>
            </div>
            {errors.postingdate && (
              <div className="invalid-feedback">
                {errors.postingdate.message}
              </div>
            )}
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Payment Mode" loading={invoiceLoading} />
              <Controller
                name="paymentmodeid"
                control={control}
                rules={{ required: "Payment Mode is required" }}
                render={({ field }) => (
                  <SelectPaymentMode
                    className={`${errors.paymentmodeid && "is-invalid"} `}
                    trigger={trigger}
                    storeId={storeId}
                    setPaymentMode={setPaymentMode}
                    {...field}
                  />
                )}
              />
              {errors.paymentmodeid && (
                <div className="invalid-feedback">
                  {errors.paymentmodeid.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Check/Card No" loading={invoiceLoading} />
              <input
                type="text"
                className={`${
                  errors.checkcardno && "is-invalid"
                }  form-control`}
                {...register("checkcardno", {
                  required:
                    paymentMode !== "Cash"
                      ? "Check/Card No is required"
                      : false,
                })}
              />
              {errors.checkcardno && (
                <div className="invalid-feedback">
                  {errors.checkcardno.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Check Amount" loading={invoiceLoading} />
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: "Amount is required",
                  validate: (value: string) => {
                    if (supplierBalanceDue.length > 0) {
                      // If an invoice is chosen, compare with its individual balance
                      if (selectedInvoiceNo) {
                        const invoice = supplierBalanceDue.find(
                          (inv) => inv.veninvoiceno === selectedInvoiceNo
                        );

                        if (
                          invoice &&
                          Number(value) > Number(invoice.veninvamtbalance)
                        ) {
                          return "Amount should not be more than balance of the selected invoice";
                        }
                      } else {
                        // Otherwise compare with total outstanding balance
                        const totalBalanceDue = supplierBalanceDue.reduce(
                          (acc, curr) => acc + Number(curr.veninvamtbalance),
                          0
                        );
                        if (Number(value) > totalBalanceDue) {
                          return "Amount should not be more than total of balance due";
                        }
                      }
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    className={`${errors.amount && "is-invalid"}  form-control`}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setAutoApply(false);
                    }}
                    onKeyDown={handleKeyDownAllowNumberOnly}
                  />
                )}
              />
              {errors.amount && (
                <div className="invalid-feedback">{errors.amount.message}</div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Invoice Number" loading={invoiceLoading} />
              <Controller
                name="invoicenumber"
                control={control}
                render={({ field }) => (
                  <SelectSupplierInvoice
                    storeId={storeId}
                    supplierId={supplierId}
                    trigger={trigger}
                    invoices={supplierBalanceDue}
                    hasInvoices
                    onChangeAdditional={() => trigger()}
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Reference" loading={invoiceLoading} />
              <input
                type="text"
                className="form-control"
                {...register("reference")}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-4 col-md-5 col-sm-12 ms-auto">
            <div className="total-order w-100 max-widthauto m-auto ">
              <ul>
                <li>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="checkebox-sm"
                      onChange={async (e) => {
                        const shouldEnable = e.target.checked;
                        if (!shouldEnable) {
                          setAutoApply(false);
                          return;
                        }
                        // Validate amount; only enable auto-apply if it is valid
                        const isAmountValid = await trigger("amount");
                        if (isAmountValid) {
                          setAutoApply(true);
                        }
                      }}
                      checked={autoApply}
                    />
                    <label className="form-check-label" htmlFor="checkebox-sm">
                      Automatically Apply Payments
                    </label>
                  </div>
                  <div className="input-blocks">
                    <label>Unapplied Amount</label>
                    <input
                      type="text"
                      className="form-control"
                      disabled
                      value={unappliedAmount.toFixed(2)}
                    />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {!invoiceLoading && !!supplierId && !!supplierBalanceDue.length && (
          <div className="modal-body-table">
            <div className="table-responsive ">
              <table className="table  datanew">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Invoice Date</th>
                    <th>Amount</th>
                    <th>Amount Paid</th>
                    <th>Balance</th>
                    <th>Amount Received</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierBalanceDue.map((item, idx) => (
                    <tr key={item.veninvoiceno}>
                      <td>{item.veninvoiceno}</td>
                      <td>
                        {dayjs(Number(item.veninvoicedate)).format(TIME_FORMAT)}
                      </td>
                      <td>${item.veninvoicetotal}</td>
                      <td>${item.veninvamtpaid}</td>
                      <td>${item.veninvamtbalance}</td>
                      <td>${allocations[idx]?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!!invoiceLoading &&
          [1, 2, 3, 4, 5, 6, 7].map((item) => <PlaceHolder key={item} />)}
        {!invoiceLoading && !!supplierId && !!supplierBalanceDue.length && (
          <ActionFooter handleCancel={closePaymentModal}>
            <ButtonLoader
              loading={saving}
              btnText="Pay"
              loadingText="Paying ..."
              disabled={!isValid || saving}
            />
          </ActionFooter>
        )}
      </div>
    </form>
  );
};

export default NewPaymentForm;
