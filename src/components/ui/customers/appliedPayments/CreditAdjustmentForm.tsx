import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import { useMutation } from "@apollo/client";

import {
  CustomerCreditAdjustmentFormType,
  CustomerCreditApply,
} from "@/types/customer";
import useCustomerCreditApply from "@/hooks/useCustomerCreditApply";
import SelectCustomer from "@/components/forms/SelectCustomer";
import SelectCustomerInvoice from "@/components/forms/SelectCustomerInvoice";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import PlaceHolder from "../../PlaceHolder";
import LabelLoader from "../../LabelLoader";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { CREATE_CUSTOMER_CREDIT_APPLY_MUTATION } from "@/lib/graphql/mutations/customer";

type CreditType = "credit_invoice" | "memo";

const CreditAdjustmentForm = ({
  storeId,
  outletId,
  startWithCreditTypeSelection,
  closePaymentModal,
}: {
  storeId: number;
  outletId: number;
  startWithCreditTypeSelection?: boolean;
  closePaymentModal: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [autoApply, setAutoApply] = useState(false);
  const [creditType, setCreditType] = useState<CreditType | "">(
    startWithCreditTypeSelection ? "" : "credit_invoice"
  );
  const shouldShowFullForm = !startWithCreditTypeSelection || !!creditType;
  const shouldShowCreditTypeStep = !!startWithCreditTypeSelection && !creditType;

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    register,
    getValues,
  } = useForm<CustomerCreditAdjustmentFormType>({
    defaultValues: {
      customerid: 0,
      postingdate: dayjs(),
      paymentmodeid: 6,
      checkcardno: "",
      amount: "",
      invoicenumber: "",
      reference: "Credit Applied",
    },
    mode: "all",
  });

  const {
    fetchCustomerCreditApplySummary,
    customerCreditInfo,
    customerBalanceDue,
    loading,
  } = useCustomerCreditApply();

  const [createCreditApply, { loading: saving }] = useMutation(
    CREATE_CUSTOMER_CREDIT_APPLY_MUTATION
  );

  const customerId = watch("customerid");
  const selectedCreditInvoiceNo = watch("checkcardno");
  const selectedTargetInvoiceNo = watch("invoicenumber");
  const amountValue = Number(watch("amount") || 0);

  const onCustomerChangeFetch = async (value: number) => {
    setValue("customerid", value as unknown as never);
    setAutoApply(false);
    setValue("invoicenumber", "");
    setValue("checkcardno", "");
    setValue("amount", "");

    if (value) {
      await fetchCustomerCreditApplySummary(storeId, outletId, value);
    }
  };

  const creditInvoices = useMemo(() => {
    if (!creditType) return [];
    const all = (customerCreditInfo?.creditInvoices || []) as CustomerCreditApply["creditInvoices"];
    return all.filter((c) => {
      const isCreditInv = !!c.isCreditInvoice;
      return creditType === "credit_invoice" ? isCreditInv : !isCreditInv;
    });
  }, [customerCreditInfo, creditType]);

  const selectedCreditInvoice = useMemo(
    () =>
      creditInvoices.find(
        (c) => String(c.invoicenumber) === String(selectedCreditInvoiceNo)
      ),
    [creditInvoices, selectedCreditInvoiceNo]
  );

  useEffect(() => {
    setAutoApply(false);
    setValue("checkcardno", "");
    setValue("amount", "");
  }, [creditType, setValue]);

  useEffect(() => {
    if (selectedCreditInvoice) {
      const positiveBal = Math.abs(Number(selectedCreditInvoice.balancedue ?? 0));
      setValue("amount", String(positiveBal));
      setValue("checkcardno", String(selectedCreditInvoice.invoicenumber ?? ""));
    } else {
      setValue("amount", "");
    }
  }, [selectedCreditInvoice, setValue]);

  const { allocations, unappliedAmount } = useMemo(() => {
    let remaining = amountValue;
    const allocArr: number[] = [];

    if (autoApply && amountValue > 0) {
      if (selectedTargetInvoiceNo) {
        customerBalanceDue.forEach((row) => {
          if (
            String(row.invoicenumber) === String(selectedTargetInvoiceNo) &&
            remaining > 0
          ) {
            const applied = Math.min(Number(row.balancedue || 0), remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      } else {
        customerBalanceDue.forEach((row) => {
          if (remaining > 0) {
            const applied = Math.min(Number(row.balancedue || 0), remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      }
    } else {
      customerBalanceDue.forEach(() => allocArr.push(0));
    }

    return { allocations: allocArr, unappliedAmount: autoApply ? remaining : amountValue };
  }, [autoApply, amountValue, customerBalanceDue, selectedTargetInvoiceNo]);

  const onSubmit = async (formData: CustomerCreditAdjustmentFormType) => {
    if (!customerCreditInfo?.hasCredit || !creditInvoices.length) {
      dispatch(
        showNotification({
          message: "No credit invoices available for this customer",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (!customerBalanceDue.length) {
      dispatch(
        showNotification({
          message: "There is no balance due for this customer",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    const payload = {
      storeid: storeId,
      customerid: formData.customerid,
      outletid: outletId,
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      creditInvoiceNumber: String(formData.checkcardno),
      amountToApply: Number(formData.amount),
      targetInvoiceNumbers: formData.invoicenumber
        ? [String(formData.invoicenumber)]
        : [],
      reference: formData.reference || undefined,
    };

    const result = await handleTryCatch(async () => {
      const response = await createCreditApply({ variables: { input: payload } });
      const { data } = response;

      if (data?.createCustomerCreditApply) {
        const successData = data.createCustomerCreditApply;
        dispatch(
          showNotification({
            message: successData.message,
            type: successData.success
              ? NOTIFICATION_TYPES.SUCCESS
              : NOTIFICATION_TYPES.ERROR,
          })
        );
        if (successData.success) {
          closePaymentModal();
        }
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
      {shouldShowCreditTypeStep && (
        <div className="d-flex justify-content-center">
          <div className="card shadow-sm" style={{ maxWidth: 620, width: "100%" }}>
            <div className="card-body">
              <div className="text-center">
                <h5 className="mb-1">Select Credit Type</h5>
                <div className="text-muted">Choose how you want to apply credit</div>
              </div>

              <div className="row g-3 mt-2">
                <div className="col-md-6">
                  <input
                    type="radio"
                    className="btn-check"
                    name="customer-credit-type"
                    id="customer-credit-type-credit-invoice"
                    autoComplete="off"
                    onChange={() => setCreditType("credit_invoice")}
                  />
                  <label
                    className="btn btn-outline-primary w-100 text-start p-3"
                    htmlFor="customer-credit-type-credit-invoice"
                  >
                    <div className="fw-semibold">Credit Invoice</div>
                    <div className="small text-muted">Use an existing credit invoice balance</div>
                  </label>
                </div>

                <div className="col-md-6">
                  <input
                    type="radio"
                    className="btn-check"
                    name="customer-credit-type"
                    id="customer-credit-type-memo"
                    autoComplete="off"
                    onChange={() => setCreditType("memo")}
                  />
                  <label
                    className="btn btn-outline-primary w-100 text-start p-3"
                    htmlFor="customer-credit-type-memo"
                  >
                    <div className="fw-semibold">Memo Credit</div>
                    <div className="small text-muted">Use a memo/adjustment credit balance</div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {shouldShowFullForm && (
      <>
      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <label>Customer</label>
            <Controller
              control={control}
              name="customerid"
              rules={{
                required: "Customer is required",
                validate: (v) => (Number(v) > 0 ? true : "Customer is required"),
              }}
              render={({ field }) => (
                <SelectCustomer
                  trigger={trigger}
                  storeId={storeId}
                  {...field}
                  value={field.value}
                  onChange={(v: number) => {
                    field.onChange(v);
                    onCustomerChangeFetch(Number(v));
                  }}
                />
              )}
            />
            {errors.customerid && (
              <div className="invalid-feedback d-block">
                {errors.customerid.message}
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
          </div>
        </div>
      </div>

      <div className={customerId && !loading ? "" : "opacity-50 pe-none"}>
        <div className="row">
          {!startWithCreditTypeSelection && (
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="input-blocks">
                <label>Credit Type</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="customer-credit-type"
                      id="customer-credit-type-credit-invoice"
                      value="credit_invoice"
                      checked={creditType === "credit_invoice"}
                      onChange={() => setCreditType("credit_invoice")}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="customer-credit-type-credit-invoice"
                    >
                      Credit Invoice
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="customer-credit-type"
                      id="customer-credit-type-memo"
                      value="memo"
                      checked={creditType === "memo"}
                      onChange={() => setCreditType("memo")}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="customer-credit-type-memo"
                    >
                      Memo Credit
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className={
              startWithCreditTypeSelection
                ? "col-lg-6 col-md-6 col-sm-12"
                : "col-lg-4 col-md-6 col-sm-12"
            }
          >
            <div className="input-blocks">
              <LabelLoader label="Check/Card No" loading={loading} />
              <Controller
                control={control}
                name="checkcardno"
                rules={{ required: "Credit invoice is required" }}
                render={({ field }) => (
                  <SelectCustomerInvoice
                    trigger={trigger}
                    invoices={creditInvoices}
                    {...field}
                    onChange={(v: number) => {
                      field.onChange(String(v));
                      setAutoApply(false);
                      setValue("invoicenumber", "");
                    }}
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

          <div
            className={
              startWithCreditTypeSelection
                ? "col-lg-6 col-md-6 col-sm-12"
                : "col-lg-4 col-md-6 col-sm-12"
            }
          >
            <div className="input-blocks">
              <LabelLoader label="Check Amount" loading={loading} />
              <input
                type="text"
                className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                {...register("amount", {
                  required: "Amount is required",
                  validate: (value: string) => {
                    const val = Number(value);
                    const creditAmt = Math.abs(
                      Number(selectedCreditInvoice?.balancedue ?? 0)
                    );
                    if (val > creditAmt) {
                      return "Amount should not be more than credit invoice balance";
                    }

                    if (customerBalanceDue.length > 0) {
                      if (getValues("invoicenumber")) {
                        const inv = customerBalanceDue.find(
                          (i) =>
                            String(i.invoicenumber) ===
                            String(getValues("invoicenumber"))
                        );
                        if (inv && val > Number(inv.balancedue)) {
                          return "Amount should not be more than balance of the selected invoice";
                        }
                      } else {
                        const totalBalanceDue = customerBalanceDue.reduce(
                          (acc, curr) => acc + Number(curr.balancedue),
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
        </div>

        <div className="row">
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="Invoice Number" loading={loading} />
              <Controller
                name="invoicenumber"
                control={control}
                render={({ field }) => (
                  <SelectCustomerInvoice
                    trigger={trigger}
                    invoices={customerBalanceDue}
                    onChangeAdditional={() => trigger()}
                    {...field}
                    onChange={(v: number) => {
                      field.onChange(String(v));
                      setAutoApply(false);
                    }}
                  />
                )}
              />
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
          <div className="col-lg-4 col-md-5 col-sm-12 ms-auto">
            <div className="total-order w-100 max-widthauto m-auto ">
              <ul>
                <li>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="customer-credit-auto-apply"
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
                    <label
                      className="form-check-label"
                      htmlFor="customer-credit-auto-apply"
                    >
                      Apply amount
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

      {loading && [1, 2, 3, 4, 5].map((i) => <PlaceHolder key={i} />)}

      {!loading && !!customerBalanceDue.length && (
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
                {customerBalanceDue.map((inv, idx) => (
                  <tr key={String(inv.invoicenumber) + idx}>
                    <td>{inv.invoicenumber}</td>
                    <td>{dayjs(inv.saledate).format(TIME_FORMAT)}</td>
                    <td>${Number(inv.totalamount || 0).toFixed(2)}</td>
                    <td>${Number(inv.amountreceived || 0).toFixed(2)}</td>
                    <td>${Number(inv.balancedue || 0).toFixed(2)}</td>
                    <td>${allocations[idx]?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!!customerId && !loading && (
        <ActionFooter handleCancel={closePaymentModal}>
          <ButtonLoader
            loading={saving}
            btnText="Save"
            loadingText="Saving ..."
            disabled={
              !isValid ||
              saving ||
              !customerCreditInfo?.hasCredit ||
              !creditInvoices.length ||
              !customerBalanceDue.length
            }
          />
        </ActionFooter>
      )}

      </>
      )}
    </form>
  );
};

export default CreditAdjustmentForm;
