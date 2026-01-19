"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Calendar } from "react-feather";
import { useDispatch } from "react-redux";

import { CustomerNewPaymentFormType } from "@/types/customer";
import useCustomerBalanceDue from "@/hooks/useCustomerBalanceDue";
import { CREATE_CUSTOMER_PAYMENT_MUTATION, CHANGE_ON_HAND_CHECK_STATUS_MUTATION } from "@/lib/graphql/mutations/customer";
import { CHECK_STATUS, NOTIFICATION_TYPES, TIME_FORMAT } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import SelectPaymentMode from "@/components/forms/SelectPaymentMode";
import SelectCustomerInvoice from "@/components/forms/SelectCustomerInvoice";
import { GET_CUSTOMER_CHEQUE_LIST_QUERY } from "@/lib/graphql/query/customer";
import Select from "react-select/base";
import SelectCustomer from "@/components/forms/SelectCustomer";
import { GET_CUSTOMER_QUERY } from "@/lib/graphql/query/customer";
import LabelLoader from "../../LabelLoader";
import PlaceHolder from "../../PlaceHolder";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import { handleKeyDownAllowNumberOnly } from "@/lib/utils/utils";

const NewPaymentForm = ({
  storeId,
  outletId,
  closePaymentModal,
}: {
  storeId: number;
  outletId: number;
  closePaymentModal: () => void;
}) => {
  const dispatch = useDispatch();
  const [autoApply, setAutoApply] = useState(false);
  const [paymentModeLabel, setPaymentModeLabel] = useState("");
  const [checkMenuIsOpen, setCheckMenuIsOpen] = useState(false);
  const [checkInput, setCheckInput] = useState("");

  const { invoices, loading: invoiceLoading, fetchCustomerBalanceDueInvoices } =
    useCustomerBalanceDue();

  const {
    handleSubmit,
    control,
    trigger,
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CustomerNewPaymentFormType>({
    defaultValues: {
      customerid: 0,
      postingdate: dayjs(),
      paymentmodeid: 0,
      checkcardno: "",
      amount: "",
      invoicenumber: "",
      reference: "",
      customercheckdetailid: undefined,
    },
    mode: "all",
  });

  const selectedCustomerId = watch("customerid");

  const { data: customerData } = useQuery(GET_CUSTOMER_QUERY, {
    variables: {
      storeid: storeId,
      customerid: Number(selectedCustomerId),
    },
    skip: !storeId || !selectedCustomerId,
  });

  const warehouseId = customerData?.getCustomer?.warehouseid;

  const [createCustomerPayment, { loading: saving }] = useMutation(
    CREATE_CUSTOMER_PAYMENT_MUTATION
  );
  const [changeOnHandCheckStatus] = useMutation(
    CHANGE_ON_HAND_CHECK_STATUS_MUTATION
  );

  const [getCustomerChequeList, { data: chequeListData, loading: chequeLoading }] =
    useLazyQuery(GET_CUSTOMER_CHEQUE_LIST_QUERY);

  const onHandChecks = useMemo(() => {
    const list = chequeListData?.getCustomerChequeList?.data || [];
    return list;
  }, [chequeListData]);

  const amountValue = Number(watch("amount") || 0);
  const selectedInvoiceNo = watch("invoicenumber");

  const { allocations, unappliedAmount, totalBalanceDue } = useMemo(() => {
    const total = invoices.reduce(
      (acc, curr) => acc + Number(curr.balancedue || 0),
      0
    );

    let remaining = amountValue;
    const allocArr: number[] = [];

    if (autoApply && amountValue > 0) {
      if (selectedInvoiceNo) {
        invoices.forEach((row) => {
          if (String(row.invoicenumber) === String(selectedInvoiceNo) && remaining > 0) {
            const applied = Math.min(Number(row.balancedue || 0), remaining);
            allocArr.push(applied);
            remaining -= applied;
          } else {
            allocArr.push(0);
          }
        });
      } else {
        invoices.forEach((row) => {
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
      invoices.forEach(() => allocArr.push(0));
    }

    return {
      allocations: allocArr,
      unappliedAmount: autoApply ? remaining : amountValue,
      totalBalanceDue: total,
    };
  }, [autoApply, amountValue, invoices, selectedInvoiceNo]);

  useEffect(() => {
    if (!selectedCustomerId || !warehouseId) return;
    fetchCustomerBalanceDueInvoices(
      storeId,
      outletId,
      Number(warehouseId),
      Number(selectedCustomerId),
      true
    );
  }, [
    selectedCustomerId,
    warehouseId,
    storeId,
    outletId,
    fetchCustomerBalanceDueInvoices,
  ]);

  useEffect(() => {
    const isOnHand = paymentModeLabel?.toLowerCase().includes("on hand");
    if (!isOnHand) {
      setValue("customercheckdetailid", undefined);
      return;
    }
    if (!selectedCustomerId) return;
    getCustomerChequeList({
      variables: {
        storeid: storeId,
        customerid: Number(selectedCustomerId),
        page: 1,
        perpage: 200,
        filters: [
          {
            key: "checkstatus",
            value: {
              filterType: "text",
              type: "equals",
              filter: CHECK_STATUS.ON_HAND_CHECK,
            },
          },
        ],
        sortModel: [],
        rowGroupCols: [],
        groupKeys: [],
      },
    });
  }, [
    paymentModeLabel,
    storeId,
    selectedCustomerId,
    getCustomerChequeList,
    setValue,
  ]);

  const onSubmit = async (formData: CustomerNewPaymentFormType) => {
    if (!warehouseId) {
      dispatch(
        showNotification({
          message: "Customer warehouse is required",
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
      return;
    }

    if (
      formData.checkcardno &&
      paymentModeLabel &&
      paymentModeLabel !== "Cash"
    ) {
      const checkResult = await handleTryCatch(async () => {
        const { data } = await getCustomerChequeList({
          variables: {
            storeid: storeId,
            customerid: Number(formData.customerid),
            page: 1,
            perpage: 10,
            filters: [
              {
                key: "checkno",
                value: {
                  filterType: "text",
                  type: "equals",
                  filter: formData.checkcardno,
                },
              },
            ],
            sortModel: [],
            rowGroupCols: [],
            groupKeys: [],
          },
        });
        const found = data?.getCustomerChequeList?.data || [];
        const hasAppliedSameCheck = found.some(
          (c: any) => c.checkstatus !== CHECK_STATUS.ON_HAND_CHECK
        );
        if (hasAppliedSameCheck) {
          throw new Error("Check already applied");
        }
        return true;
      });

      if (checkResult.error) {
        dispatch(
          showNotification({
            message: checkResult.error,
            type: NOTIFICATION_TYPES.ERROR,
          })
        );
        return;
      }
    }

    const payload = {
      storeid: storeId,
      customerid: Number(formData.customerid),
      outletid: outletId,
      warehouseid: Number(warehouseId),
      postingdate: formData.postingdate.format("YYYY-MM-DD"),
      paymentmodeid: formData.paymentmodeid,
      amount: Number(formData.amount),
      checkcardno: formData.checkcardno || undefined,
      invoicenumbers: formData.invoicenumber ? [String(formData.invoicenumber)] : [],
      reference: formData.reference || undefined,
      customercheckdetailid: formData.customercheckdetailid,
    };

    const result = await handleTryCatch(async () => {
      const response = await createCustomerPayment({ variables: { input: payload } });
      const { data } = response;
      if (data?.createCustomerPayment) {
        const successData = data.createCustomerPayment;

        dispatch(
          showNotification({
            message: successData.message,
            type: successData.success
              ? NOTIFICATION_TYPES.SUCCESS
              : NOTIFICATION_TYPES.ERROR,
          })
        );

        if (successData.success) {
          if (
            formData.customercheckdetailid &&
            paymentModeLabel?.toLowerCase().includes("on hand")
          ) {
            await changeOnHandCheckStatus({
              variables: {
                storeid: storeId,
                customercheckdetailid: Number(formData.customercheckdetailid),
                status: CHECK_STATUS.DEPOSITED_TO_BANK,
              },
            });
          }
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
      <div className="row">
        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <LabelLoader label="Customer" loading={invoiceLoading} />
            <Controller
              name="customerid"
              control={control}
              rules={{
                validate: (v: number) =>
                  Number(v) > 0 || "Customer is required",
              }}
              render={({ field }) => (
                <SelectCustomer
                  className={`${errors.customerid && "is-invalid"} `}
                  trigger={trigger}
                  storeId={storeId}
                  {...field}
                  onChange={(v: number) => {
                    field.onChange(v);
                    setAutoApply(false);
                    setValue("invoicenumber", "");
                    setValue("amount", "");
                    setValue("checkcardno", "");
                    setValue("customercheckdetailid", undefined);
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
            <LabelLoader label="Posting Date" loading={invoiceLoading} />
            <div className="input-groupicon calender-input">
              <Calendar className="info-img" />
              <Controller
                name="postingdate"
                control={control}
                rules={{ required: "Posting date is required" }}
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
            {errors.postingdate && (
              <div className="invalid-feedback d-block">
                {errors.postingdate.message}
              </div>
            )}
          </div>
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
                  setPaymentMode={setPaymentModeLabel}
                  {...field}
                  onChange={(v: number) => {
                    field.onChange(v);
                    setAutoApply(false);
                  }}
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

        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <LabelLoader label="Check/Ref No" loading={invoiceLoading} />
            <input
              type="text"
              className={`${errors.checkcardno && "is-invalid"}  form-control`}
              {...register("checkcardno", {
                required:
                  paymentModeLabel && paymentModeLabel !== "Cash"
                    ? "Check/Ref No is required"
                    : false,
              })}
              disabled={paymentModeLabel?.toLowerCase().includes("on hand")}
            />
            {errors.checkcardno && (
              <div className="invalid-feedback d-block">
                {errors.checkcardno.message}
              </div>
            )}
          </div>
        </div>

        {paymentModeLabel?.toLowerCase().includes("on hand") && (
          <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="input-blocks">
              <LabelLoader label="On Hand Check" loading={invoiceLoading || chequeLoading} />
              <Controller
                name="customercheckdetailid"
                control={control}
                rules={{ required: "On hand check is required" }}
                render={({ field }) => (
                  <Select
                    isLoading={chequeLoading}
                    options={onHandChecks.map((c: any) => ({
                      value: c.customercheckdetailid,
                      label: `${c.checkno}`,
                      checkno: c.checkno,
                    }))}
                    placeholder="Select on hand check"
                    isClearable
                    menuIsOpen={checkMenuIsOpen}
                    onMenuOpen={() => setCheckMenuIsOpen(true)}
                    onMenuClose={() => setCheckMenuIsOpen(false)}
                    inputValue={checkInput}
                    onInputChange={setCheckInput}
                    className={`form-control p-0 ${
                      errors.customercheckdetailid && "is-invalid"
                    } select-form-custom`}
                    value={
                      field.value
                        ? {
                            value: field.value,
                            label:
                              onHandChecks.find(
                                (c: any) =>
                                  c.customercheckdetailid === field.value
                              )?.checkno || "",
                          }
                        : null
                    }
                    onChange={(opt: any) => {
                      field.onChange(opt?.value);
                      if (opt?.checkno) {
                        setValue("checkcardno", opt.checkno);
                      }
                      trigger("customercheckdetailid");
                    }}
                  />
                )}
              />
              {errors.customercheckdetailid && (
                <div className="invalid-feedback d-block">
                  {errors.customercheckdetailid.message}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="col-lg-4 col-md-6 col-sm-12">
          <div className="input-blocks">
            <LabelLoader label="Amount" loading={invoiceLoading} />
            <Controller
              name="amount"
              control={control}
              rules={{
                required: "Amount is required",
                validate: (value: string) => {
                  if (!invoices.length) return true;

                  const numeric = Number(value || 0);
                  if (numeric <= 0) return "Amount should be greater than 0";

                  if (selectedInvoiceNo) {
                    const inv = invoices.find(
                      (i) => String(i.invoicenumber) === String(selectedInvoiceNo)
                    );
                    if (inv && numeric > Number(inv.balancedue || 0)) {
                      return "Amount should not be more than balance of the selected invoice";
                    }
                  } else {
                    if (numeric > totalBalanceDue) {
                      return "Amount should not be more than total of balance due";
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
              <div className="invalid-feedback d-block">{errors.amount.message}</div>
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
                <SelectCustomerInvoice
                  trigger={trigger}
                  invoices={invoices}
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
                    id="customer-auto-apply"
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
                    htmlFor="customer-auto-apply"
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

      <div className={!invoiceLoading ? "" : "opacity-50 pe-none"}>
        {!invoiceLoading && !!invoices.length && (
          <div className="modal-body-table">
            <div className="table-responsive ">
              <table className="table  datanew">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Invoice Date</th>
                    <th>Amount</th>
                    <th>Amount paid</th>
                    <th>Balance</th>
                    <th>Amount Received</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((item, idx) => (
                    <tr key={String(item.invoicenumber) + idx}>
                      <td>{item.invoicenumber}</td>
                      <td>{dayjs(item.saledate).format(TIME_FORMAT)}</td>
                      <td>${Number(item.totalamount || 0).toFixed(2)}</td>
                      <td>${Number(item.amountreceived || 0).toFixed(2)}</td>
                      <td>${Number(item.balancedue || 0).toFixed(2)}</td>
                      <td>${allocations[idx]?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!!invoiceLoading && [1, 2, 3, 4, 5, 6, 7].map((item) => <PlaceHolder key={item} />)}

        {!invoiceLoading && !invoices.length && (
          <div className="p-2">No balance due invoices</div>
        )}

        {!invoiceLoading && (
          <ActionFooter handleCancel={closePaymentModal}>
            <ButtonLoader
              loading={saving}
              btnText="Save"
              loadingText="Saving ..."
              disabled={!isValid || saving || !invoices.length || !warehouseId}
            />
          </ActionFooter>
        )}
      </div>

    </form>
  );
};

export default NewPaymentForm;
