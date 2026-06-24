"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { X, Check, RefreshCw } from "react-feather";
import dayjs from "dayjs";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import {
  CREATE_NEW_EXPENSE_MUTATION,
  UPDATE_EXPENSE_MUTATION,
} from "@/lib/graphql/mutations/expenses";
import {
  GET_EXPENSE_CODE_QUERY,
  GET_PAYMENT_EXPENSE_MODES_QUERY,
} from "@/lib/graphql/query/accounts";
import { AccountsExpenseListType } from "@/types/accounts";

interface FormValues {
  expensecodeid: number;
  expensedetail: string;
  expensedate: string;
  expenseamount: number;
  expensemode: string;
  expensenotes: string;
  expensechknumber: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: AccountsExpenseListType | null;
  outletId: number;
}

const ExpenseModal = ({ isOpen, onClose, onSuccess, editData, outletId }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const storeId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const { data: expenseCodesData } = useQuery(GET_EXPENSE_CODE_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId || !isOpen,
  });

  const { data: paymentModesData } = useQuery(GET_PAYMENT_EXPENSE_MODES_QUERY, {
    variables: { storeid: storeId },
    skip: !storeId || !isOpen,
  });

  const [createExpense] = useMutation(CREATE_NEW_EXPENSE_MUTATION);
  const [updateExpense] = useMutation(UPDATE_EXPENSE_MUTATION);

  useEffect(() => {
    if (isOpen) {
      reset({
        expensecodeid: editData?.expensecodeid ?? undefined,
        expensedetail: editData?.expensedetail ?? "",
        expensedate: editData?.expensedate
          ? dayjs(editData.expensedate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        expenseamount: editData?.expenseamount ?? undefined,
        expensemode: editData?.expensemode ?? "",
        expensenotes: editData?.expensenotes ?? "",
        expensechknumber: editData?.expensechknumber ?? "",
      });
    }
  }, [isOpen, editData, reset]);

  const onSubmit = async (values: FormValues) => {
    const result = await handleTryCatch(async () => {
      if (editData) {
        await updateExpense({
          variables: {
            input: {
              storeid: storeId,
              expenseid: editData.expenseid,
              expensecodeid: Number(values.expensecodeid),
              expensedetail: values.expensedetail,
              expensedate: values.expensedate,
              expenseamount: Number(values.expenseamount),
              expensemode: values.expensemode,
              expensenotes: values.expensenotes || null,
              expensechknumber: values.expensechknumber || null,
              warehouseid: editData.warehouseid,
            },
          },
        });
        dispatch(showNotification({ message: "Expense updated", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        await createExpense({
          variables: {
            input: {
              storeid: storeId,
              warehouseid: outletId,
              expensecodeid: Number(values.expensecodeid),
              expensedetail: values.expensedetail,
              expensedate: values.expensedate,
              expenseamount: Number(values.expenseamount),
              expensemode: values.expensemode,
              expensenotes: values.expensenotes || null,
              expensechknumber: values.expensechknumber || null,
            },
          },
        });
        dispatch(showNotification({ message: "Expense added", type: NOTIFICATION_TYPES.SUCCESS }));
      }
      onSuccess();
      onClose();
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  if (!isOpen) return null;

  const expenseCodes = expenseCodesData?.getExpenseCode ?? [];
  const paymentModes = paymentModesData?.getPaymentExpenseModes ?? [];

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editData ? "Edit Expense" : "Add Expense"}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Expense Code <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.expensecodeid ? "is-invalid" : ""}`}
                    {...register("expensecodeid", { required: "Expense code is required", valueAsNumber: true })}
                  >
                    <option value="">Select expense code…</option>
                    {expenseCodes.map((ec: { expensecode: number; accountdescription: string }) => (
                      <option key={ec.expensecode} value={ec.expensecode}>
                        {ec.accountdescription}
                      </option>
                    ))}
                  </select>
                  {errors.expensecodeid && (
                    <div className="invalid-feedback">{errors.expensecodeid.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${errors.expensedate ? "is-invalid" : ""}`}
                    {...register("expensedate", { required: "Date is required" })}
                  />
                  {errors.expensedate && (
                    <div className="invalid-feedback">{errors.expensedate.message}</div>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Detail / Description <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.expensedetail ? "is-invalid" : ""}`}
                    placeholder="e.g. Office supplies, Rent, Utilities"
                    {...register("expensedetail", { required: "Detail is required" })}
                  />
                  {errors.expensedetail && (
                    <div className="invalid-feedback">{errors.expensedetail.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control ${errors.expenseamount ? "is-invalid" : ""}`}
                    placeholder="0.00"
                    {...register("expenseamount", {
                      required: "Amount is required",
                      valueAsNumber: true,
                      min: { value: 0.01, message: "Amount must be greater than 0" },
                    })}
                  />
                  {errors.expenseamount && (
                    <div className="invalid-feedback">{errors.expenseamount.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Payment Mode <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.expensemode ? "is-invalid" : ""}`}
                    {...register("expensemode", { required: "Payment mode is required" })}
                  >
                    <option value="">Select payment mode…</option>
                    {paymentModes.map((pm: { paymentmodeid: number; paymode: string }) => (
                      <option key={pm.paymentmodeid} value={pm.paymode}>
                        {pm.paymode}
                      </option>
                    ))}
                  </select>
                  {errors.expensemode && (
                    <div className="invalid-feedback">{errors.expensemode.message}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Check / Reference Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional check or reference number"
                    {...register("expensechknumber")}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Optional notes"
                    {...register("expensenotes")}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-cancel me-2" onClick={onClose}>
                <X size={14} className="me-1" />
                Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                {editData ? (
                  <><RefreshCw size={14} className="me-1" />Update Expense</>
                ) : (
                  <><Check size={14} className="me-1" />Add Expense</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
