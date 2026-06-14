"use client";

import SelectCustomer from "@/components/forms/SelectCustomer";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import {
  ADD_NEW_CHECK_ON_HAND_MUTATION,
  DELETE_CHECK_ON_HAND_MUTATION,
  UPDATE_CHECK_ON_HAND_MUTATION,
} from "@/lib/graphql/mutations/customer";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { CheckOnHandType } from "@/types/customer";
import { useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import { Save, Trash2, Pencil, PlusCircle } from "lucide-react";
import useWarehouse from "@/hooks/useWarehouse";
import { DatePicker } from "antd";
import dayjs from "dayjs";

type FormValues = {
  entries: CheckOnHandType[];
};

const blankEntry = (warehouseId: string | number = ""): CheckOnHandType => ({
  warehouseid: String(warehouseId),
  customerid: "",
  checkno: "",
  checkamount: "",
  checkpostingdate: "",
  customercheckdetailid: "",
});

const AddOnHandChequeModal = ({
  setShowPrintModal,
  triggerFetchSummary,
}: {
  setShowPrintModal: (value: boolean) => void;
  triggerFetchSummary: () => Promise<void>;
}) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const { fetchWarehouseByOutletId, warehouses } = useWarehouse();
  useEffect(() => {
    if (parsedOutletId) fetchWarehouseByOutletId(parsedOutletId);
  }, [fetchWarehouseByOutletId, parsedOutletId]);

  const defaultWarehouse = useMemo(
    () => warehouses.find((w) => w.issystem) ?? warehouses[0],
    [warehouses]
  );

  const {
    control,
    register,
    trigger,
    setValue,
    formState: { errors },
    getValues,
    setError,
  } = useForm<FormValues>({
    defaultValues: { entries: [blankEntry()] },
    mode: "all",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "entries" });

  useEffect(() => {
    if (!defaultWarehouse?.warehouseid) return;
    fields.forEach((_, i) => {
      if (!getValues(`entries.${i}.customercheckdetailid`)) {
        setValue(`entries.${i}.warehouseid`, String(defaultWarehouse.warehouseid));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWarehouse]);

  const [createNewCheckOnHand] = useMutation(ADD_NEW_CHECK_ON_HAND_MUTATION);
  const [updateCheckOnHand] = useMutation(UPDATE_CHECK_ON_HAND_MUTATION);
  const [deleteCheckOnHand] = useMutation(DELETE_CHECK_ON_HAND_MUTATION);
  const dispatch = useAppDispatch();
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleSave = async (index: number) => {
    const isValid = await trigger(`entries.${index}`);
    if (!isValid) return;

    const entry = getValues(`entries.${index}`);
    const allEntries = getValues("entries");

    const isDuplicate = allEntries.some(
      (e, i) =>
        i !== index &&
        e.customerid === entry.customerid &&
        e.checkno === entry.checkno
    );
    if (isDuplicate) {
      setError(`entries.${index}.checkno`, {
        type: "manual",
        message: "Duplicate check# for same customer",
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateEntry: any = {
      customerid: Number(entry.customerid),
      checkamount: Number(entry.checkamount),
      warehouseid: Number(entry.warehouseid),
      checkpostingdate: new Date(entry.checkpostingdate).toISOString(),
      checkno: entry.checkno,
    };
    if (entry.customercheckdetailid) {
      updateEntry = {
        ...updateEntry,
        customercheckdetailid: Number(entry.customercheckdetailid),
      };
    }

    const result = await handleTryCatch(async () => {
      let response;
      if (entry.customercheckdetailid) {
        response = await updateCheckOnHand({
          variables: { input: updateEntry, storeid: parsedStoreId },
        });
      } else {
        response = await createNewCheckOnHand({
          variables: { input: updateEntry, storeid: parsedStoreId },
        });
      }
      setEditIndex(null);
      const { data } = response;
      if (data?.createNewCheckOnHand || data?.updateNewCheckOnHand) {
        const successData = data.createNewCheckOnHand || data.updateNewCheckOnHand;
        if (!entry.customercheckdetailid) {
          setValue(
            `entries.${index}.customercheckdetailid`,
            successData.data.customercheckdetailid
          );
        }
        dispatch(
          showNotification({
            message: successData.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
      }
      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR })
      );
    }
  };

  const handleDelete = async (index: number) => {
    const result = await handleTryCatch(async () => {
      const response = await deleteCheckOnHand({
        variables: {
          customercheckdetailid: getValues(`entries.${index}.customercheckdetailid`),
          storeid: parsedStoreId,
        },
      });
      const { data } = response;
      if (data?.deleteCheckOnHand) {
        remove(index);
        if (editIndex === index) setEditIndex(null);
        dispatch(
          showNotification({
            message: data.deleteCheckOnHand.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
      }
      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR })
      );
    }
  };

  const thStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#6c757d",
    borderBottom: "2px solid #dee2e6",
    padding: "8px 10px",
    whiteSpace: "nowrap",
    background: "#f8f9fa",
  };

  const tdStyle: React.CSSProperties = {
    padding: "5px 6px",
    verticalAlign: "top",
    borderBottom: "1px solid #f1f3f5",
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header py-3" style={{ borderBottom: "1px solid #e9ecef" }}>
            <h5 className="modal-title fw-semibold" style={{ fontSize: 15 }}>
              Add New Check
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                triggerFetchSummary();
                setShowPrintModal(false);
              }}
            />
          </div>

          {/* Body */}
          <div className="modal-body p-0" style={{ maxHeight: "65vh", overflowY: "auto" }}>
            <table className="table table-borderless mb-0" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "27%" }}>Customer</th>
                  <th style={{ ...thStyle, width: "18%" }}>Outlet</th>
                  <th style={{ ...thStyle, width: "14%" }}>Check No</th>
                  <th style={{ ...thStyle, width: "12%" }}>Amount</th>
                  <th style={{ ...thStyle, width: "14%" }}>Check Date</th>
                  <th style={{ ...thStyle, width: "15%", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const isEditable =
                    (!!field.customercheckdetailid && editIndex === index) ||
                    field.customercheckdetailid === "";
                  const rowErrors = errors?.entries?.[index] || {};

                  return (
                    <tr
                      key={field.id}
                      style={{
                        background: isEditable ? "#fffef7" : "transparent",
                      }}
                    >
                      {/* Customer */}
                      <td style={tdStyle}>
                        <Controller
                          name={`entries.${index}.customerid`}
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <SelectCustomer
                              className={`form-control-sm${rowErrors.customerid ? " is-invalid" : ""}`}
                              storeId={parsedStoreId}
                              trigger={trigger}
                              disableField={!isEditable}
                              {...field}
                            />
                          )}
                        />
                        {rowErrors.customerid && (
                          <div className="invalid-feedback d-block" style={{ fontSize: 10 }}>
                            {rowErrors.customerid.message}
                          </div>
                        )}
                      </td>

                      {/* Warehouse */}
                      <td style={tdStyle}>
                        <Controller
                          name={`entries.${index}.warehouseid`}
                          control={control}
                          rules={{ required: "Required" }}
                          disabled={!isEditable}
                          render={({ field }) => (
                            <SelectWarehouse
                              className={`form-control-sm${rowErrors.warehouseid ? " is-invalid" : ""}`}
                              storeId={parsedStoreId}
                              outletId={parsedOutletId}
                              trigger={trigger}
                              disableField={!isEditable}
                              {...field}
                            />
                          )}
                        />
                        {rowErrors.warehouseid && (
                          <div className="invalid-feedback d-block" style={{ fontSize: 10 }}>
                            {rowErrors.warehouseid.message}
                          </div>
                        )}
                      </td>

                      {/* Check No */}
                      <td style={tdStyle}>
                        <input
                          disabled={!isEditable}
                          type="text"
                          className={`form-control form-control-sm${rowErrors.checkno ? " is-invalid" : ""}`}
                          {...register(`entries.${index}.checkno`, {
                            required: "Required",
                          })}
                        />
                        {rowErrors.checkno && (
                          <div className="invalid-feedback" style={{ fontSize: 10 }}>
                            {rowErrors.checkno.message}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={tdStyle}>
                        <input
                          disabled={!isEditable}
                          type="text"
                          className={`form-control form-control-sm${rowErrors.checkamount ? " is-invalid" : ""}`}
                          {...register(`entries.${index}.checkamount`, {
                            required: "Required",
                          })}
                        />
                        {rowErrors.checkamount && (
                          <div className="invalid-feedback" style={{ fontSize: 10 }}>
                            {rowErrors.checkamount.message}
                          </div>
                        )}
                      </td>

                      {/* Check Date */}
                      <td style={tdStyle}>
                        <Controller
                          name={`entries.${index}.checkpostingdate`}
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <DatePicker
                              disabled={!isEditable}
                              format="MM/DD/YYYY"
                              className={`form-control form-control-sm p-0${rowErrors.checkpostingdate ? " is-invalid" : ""}`}
                              style={{ height: 31 }}
                              value={field.value ? dayjs(field.value) : null}
                              onChange={(date) =>
                                field.onChange(date ? date.toISOString() : "")
                              }
                              allowClear={false}
                            />
                          )}
                        />
                        {rowErrors.checkpostingdate && (
                          <div className="invalid-feedback d-block" style={{ fontSize: 10 }}>
                            {rowErrors.checkpostingdate.message}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div
                          className="d-inline-flex align-items-center"
                          style={{ gap: 2, paddingTop: 4 }}
                        >
                          {isEditable && (
                            <button
                              type="button"
                              className="p-1 btn btn-link"
                              style={{ lineHeight: 1, color: "#198754" }}
                              title="Save"
                              onClick={() => handleSave(index)}
                            >
                              <Save size={14} />
                            </button>
                          )}
                          {field.customercheckdetailid && editIndex !== index && (
                            <button
                              type="button"
                              className="p-1 btn btn-link"
                              style={{ lineHeight: 1, color: "#f59e0b" }}
                              title="Edit"
                              onClick={() => setEditIndex(index)}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {field.customercheckdetailid && (
                            <button
                              type="button"
                              className="p-1 btn btn-link"
                              style={{ lineHeight: 1, color: "#dc3545" }}
                              title="Delete"
                              onClick={() => handleDelete(index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
            className="modal-footer justify-content-start py-2"
            style={{ borderTop: "1px solid #e9ecef" }}
          >
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => append(blankEntry(defaultWarehouse?.warehouseid ?? ""))}
            >
              <PlusCircle size={14} />
              Add Row
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOnHandChequeModal;
