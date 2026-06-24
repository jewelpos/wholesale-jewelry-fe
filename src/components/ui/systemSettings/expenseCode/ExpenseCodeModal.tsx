"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { X, Check, RefreshCw } from "react-feather";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import {
  CREATE_EXPENSE_CODE_MUTATION,
  UPDATE_EXPENSE_CODE_MUTATION,
} from "@/lib/graphql/mutations/expenses";

export interface ExpenseCodeRow {
  expensecode: number;
  accountdescription: string;
  accounttype: string;
  warehouseid?: number;
}

interface FormValues {
  accountdescription: string;
  accounttype: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: ExpenseCodeRow | null;
  outletId: number;
}

const ExpenseCodeModal = ({ isOpen, onClose, onSuccess, editData, outletId }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const storeId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const [createExpenseCode] = useMutation(CREATE_EXPENSE_CODE_MUTATION);
  const [updateExpenseCode] = useMutation(UPDATE_EXPENSE_CODE_MUTATION);

  useEffect(() => {
    if (isOpen) {
      reset({
        accountdescription: editData?.accountdescription ?? "",
        accounttype: editData?.accounttype ?? "",
      });
    }
  }, [isOpen, editData, reset]);

  const onSubmit = async (values: FormValues) => {
    const result = await handleTryCatch(async () => {
      if (editData) {
        await updateExpenseCode({
          variables: {
            input: {
              storeid: storeId,
              expensecode: editData.expensecode,
              accountdescription: values.accountdescription,
              accounttype: values.accounttype,
            },
          },
        });
        dispatch(showNotification({ message: "Expense code updated", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        await createExpenseCode({
          variables: {
            input: {
              storeid: storeId,
              warehouseid: outletId,
              accountdescription: values.accountdescription,
              accounttype: values.accounttype,
            },
          },
        });
        dispatch(showNotification({ message: "Expense code added", type: NOTIFICATION_TYPES.SUCCESS }));
      }
      onSuccess();
      onClose();
    });
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {editData ? "Edit Expense Code" : "Add Expense Code"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              {editData && (
                <div className="mb-3">
                  <label className="form-label">Code ID</label>
                  <input
                    className="form-control"
                    value={editData.expensecode}
                    disabled
                  />
                  <div className="form-text" style={{ fontSize: 11 }}>Code ID cannot be changed after creation</div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  Account Description <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.accountdescription ? "is-invalid" : ""}`}
                  placeholder="e.g. Office Supplies, Rent, Utilities"
                  {...register("accountdescription", { required: "Description is required" })}
                />
                {errors.accountdescription && (
                  <div className="invalid-feedback">{errors.accountdescription.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Account Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.accounttype ? "is-invalid" : ""}`}
                  {...register("accounttype", { required: "Account type is required" })}
                >
                  <option value="">Select type…</option>
                  <option value="Expense">Expense</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Other">Other</option>
                </select>
                {errors.accounttype && (
                  <div className="invalid-feedback">{errors.accounttype.message}</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-cancel me-2" onClick={onClose}>
                <X size={14} className="me-1" />
                Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                {editData ? (
                  <><RefreshCw size={14} className="me-1" />Update</>
                ) : (
                  <><Check size={14} className="me-1" />Add</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCodeModal;
