import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import { useMutation } from "@apollo/client";
import {
  CreditAdjustmentFormType,
  SupplierCreditInfo,
} from "@/types/supplier";
import useSupplier from "@/hooks/useSupplier";
import SelectSupplier from "@/components/forms/SelectSupplier";
import SelectSupplierInvoice from "@/components/forms/SelectSupplierInvoice";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import PlaceHolder from "../../PlaceHolder";
import LabelLoader from "../../LabelLoader";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CREATE_SUPPLIER_CREDIT_APPLY_MUTATION } from "@/lib/graphql/mutations/supplier";

const CreditAdjustmentForm = ({
  storeId,
  outletId,
  closePaymentModal,
}: {
  storeId: number;
  outletId: number;
  closePaymentModal: () => void;
}) => {
  const dispatch = useAppDispatch();
  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    register,
    getValues,
  } = useForm<CreditAdjustmentFormType>({
    defaultValues: {
      supplierid: 0,
      postingdate: dayjs(),
      paymentmodeid: 6, // will be disabled, default conceptual 'CrdInv'
      checkcardno: "", // stores selected credit invoice number
      amount: "",
      invoicenumber: "",
      reference: "",
    },
    mode: "all",
  });

  const { fetchSupplierCreditApplySummary, supplierCreditInfo, supplierBalanceDue, loading } =
    useSupplier();
  const [autoApply, setAutoApply] = useState(false);
  const [createCreditApply, { loading: saving }] = useMutation(
    CREATE_SUPPLIER_CREDIT_APPLY_MUTATION
  );

  const supplierId = watch("supplierid");
  const selectedCreditInvoiceNo = watch("checkcardno");
  const selectedTargetInvoiceNo = watch("invoicenumber");
  const amountValue = Number(watch("amount") || 0);

  // On supplier select, fetch credit apply summary
  const onSupplierChangeFetch = async (value: string) => {
    const parsed = parseInt(value);
    setValue("supplierid", parsed as unknown as never);
    if (parsed) {
      await fetchSupplierCreditApplySummary(storeId, outletId, parsed);
    }
  };

  // When credit invoice is selected, set amount = its balance
  const creditInvoices = (supplierCreditInfo?.creditInvoices || []) as SupplierCreditInfo["creditInvoices"];
  const balanceDueInvoices = supplierCreditInfo?.balanceDueInvoices || [];
  const selectedCreditInvoice = useMemo(
    () => creditInvoices.find((c) => c.veninvoiceno === selectedCreditInvoiceNo),
    [creditInvoices, selectedCreditInvoiceNo]
  );

  React.useEffect(() => {
    if (selectedCreditInvoice) {
      // Ensure we use a positive amount for credit invoice balance
      const positiveBal = Math.abs(Number(selectedCreditInvoice.veninvamtbalance ?? 0));
      setValue("amount", String(positiveBal));
    } else {
      setValue("amount", "");
    }
  }, [selectedCreditInvoice, setValue]);

  // Allocation display similar to NewPaymentForm
  const { allocations, unappliedAmount } = useMemo(() => {
    let remaining = amountValue;
    const allocArr: number[] = [];
    if (autoApply && amountValue > 0) {
      if (selectedTargetInvoiceNo) {
        balanceDueInvoices.forEach((row) => {
          if (row.veninvoiceno === selectedTargetInvoiceNo && remaining > 0) {
            const applied = Math.min(Number(row.veninvamtbalance), remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      } else {
        balanceDueInvoices.forEach((row) => {
          if (remaining > 0) {
            const applied = Math.min(Number(row.veninvamtbalance), remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      }
    } else {
      balanceDueInvoices.forEach(() => allocArr.push(0));
    }
    return { allocations: allocArr, unappliedAmount: autoApply ? remaining : amountValue };
  }, [autoApply, amountValue, balanceDueInvoices, selectedTargetInvoiceNo]);

  const onSubmit = async (formData: CreditAdjustmentFormType) => {
    const payload = {
      storeid: storeId,
      supplierid: formData.supplierid,
      outletid: outletId,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      creditInvoiceNumber: formData.checkcardno,
      amountToApply: Number(formData.amount),
      targetInvoiceNumbers: formData.invoicenumber
        ? [formData.invoicenumber]
        : [],
      reference: formData.reference,
    };

    const result = await handleTryCatch(async () => {
      const response = await createCreditApply({ variables: { input: payload } });
      const { data } = response;
      if (data?.createSupplierCreditApply) {
        const successData = data.createSupplierCreditApply;
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
      {/* Supplier, posting date, payment mode */}
      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Supplier</label>
            <Controller
              control={control}
              name="supplierid"
              rules={{ required: "Supplier is required" }}
              render={({ field }) => (
                <SelectSupplier
                  trigger={trigger}
                  storeId={storeId}
                  {...field}
                  onChangeAdditional={onSupplierChangeFetch}
                />
              )}
            />
            {errors.supplierid && (
              <div className="invalid-feedback d-block">
                {errors.supplierid.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Posting Date</label>
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
            <label>Payment Mode</label>
            <Controller
              control={control}
              name="paymentmodeid"
              // For credit application, this is conceptually fixed to 'CrdInv'
              rules={{}}
              render={({ field }) => (
                <SelectPaymentMode
                  trigger={trigger}
                  storeId={storeId}
                  disableField
                  {...field}
                />
              )}
            />
            {errors.paymentmodeid && (
              <div className="invalid-feedback d-block">
                {errors.paymentmodeid.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice selection, amount, reference */}
      <div className={supplierId && !loading ? "" : "opacity-50 pe-none"}>
        <div className="row">
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Check/Card No" loading={loading} />
              <Controller
                control={control}
                name="checkcardno"
                rules={{ required: "Credit invoice is required" }}
                render={({ field }) => (
                  <SelectSupplierInvoice
                    trigger={trigger}
                    storeId={storeId}
                    supplierId={supplierId}
                    invoices={creditInvoices as unknown as any}
                    hasInvoices={true}
                    {...field}
                  />
                )}
              />
              {errors.checkcardno && (
                <div className="invalid-feedback d-block">
                  {errors.checkcardno.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Check Amount" loading={loading} />
              <input
                type="text"
                className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                {...register("amount", {
                  required: "Amount is required",
                  validate: (value: string) => {
                    if (!supplierCreditInfo) return true;
                    const val = Number(value);
                    // Use positive value in case credit balances are negative from backend
                    const creditAmt = Math.abs(Number(selectedCreditInvoice?.veninvamtbalance ?? 0));
                    if (val > creditAmt) {
                      return "Amount should not be more than credit invoice balance";
                    }
                    if (balanceDueInvoices.length > 0) {
                      if (getValues("invoicenumber")) {
                        const inv = balanceDueInvoices.find(
                          (i) => i.veninvoiceno === getValues("invoicenumber")
                        );
                        if (inv && val > Number(inv.veninvamtbalance)) {
                          return "Amount should not be more than balance of the selected invoice";
                        }
                      } else {
                        const totalBalanceDue = balanceDueInvoices.reduce(
                          (acc, curr) => acc + Number(curr.veninvamtbalance),
                          0
                        );
                        if (val > totalBalanceDue) {
                          return "Amount should not be more than total of balance due";
                        }
                      }
                    }
                    return true;
                  },
                })}
                disabled
              />
              {errors.amount && (
                <div className="invalid-feedback d-block">
                  {errors.amount.message}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <label>Reference</label>
              <input
                type="text"
                className="form-control"
                {...register("reference")}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Invoice Number" loading={loading} />
              <Controller
                name="invoicenumber"
                control={control}
                render={({ field }) => (
                  <SelectSupplierInvoice
                    trigger={trigger}
                    storeId={storeId}
                    supplierId={supplierId}
                    invoices={balanceDueInvoices as unknown as any}
                    hasInvoices
                    onChangeAdditional={() => trigger()}
                    {...field}
                  />
                )}
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
                      id="credit-auto-apply"
                      onChange={async (e) => {
                        const shouldEnable = e.target.checked;
                        if (!shouldEnable) {
                          setAutoApply(false);
                          return;
                        }
                        const isAmountValid = await trigger("amount");
                        if (isAmountValid) {
                          setAutoApply(true);
                        }
                      }}
                      checked={autoApply}
                    />
                    <label className="form-check-label" htmlFor="credit-auto-apply">
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
      </div>

      {/* Invoice list table */}
      {loading && [1, 2, 3, 4, 5].map((i) => <PlaceHolder key={i} />)}
      {!loading && !!balanceDueInvoices.length && (
        <div className="modal-body-table">
          <div className="table-responsive">
            <table className="table datanew">
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
                {balanceDueInvoices.map((inv, idx) => (
                  <tr key={inv.veninvoiceno}>
                    <td>{inv.veninvoiceno}</td>
                    <td>
                      {dayjs(inv.veninvoicedate).format(TIME_FORMAT)}
                    </td>
                    <td>${inv.veninvoicetotal}</td>
                    <td>${inv.veninvamtpaid}</td>
                    <td>${inv.veninvamtbalance}</td>
                    <td>${allocations[idx]?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action footer */}
      {!!supplierId && !loading && (
        <ActionFooter handleCancel={closePaymentModal}>
          <ButtonLoader
            loading={saving}
            btnText="Pay"
            loadingText="Saving ..."
            disabled={!isValid || saving}
          />
        </ActionFooter>
      )}
    </form>
  );
};

export default CreditAdjustmentForm;
