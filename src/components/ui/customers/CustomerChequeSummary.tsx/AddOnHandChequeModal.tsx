"use client";

import SelectCustomer from "@/components/forms/SelectCustomer";
import CustomerOpenInvoicesPanel from "./CustomerOpenInvoicesPanel";
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
import { createPortal } from "react-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import { Save, Trash2, Pencil, PlusCircle } from "lucide-react";
import useWarehouse from "@/hooks/useWarehouse";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { handleEnterAsTab } from "@/lib/utils/formKeyboard";

type FormValues = {
  entries: CheckOnHandType[];
};

// Comma-grouped, 2-decimal display (the "$" itself comes from the input-group prefix
// next to it, so this formatter deliberately leaves the currency symbol out) — used to
// show a fully-settled value (on mount, and again on blur).
const amountDisplayFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatAmountForDisplay = (value: unknown): string => {
  const n = Number(value);
  if (value === "" || value == null || !Number.isFinite(n)) return "";
  return amountDisplayFormatter.format(n);
};

// Live, as-you-type comma grouping on just the integer part — deliberately does NOT
// force 2 decimal places (that would fight the user mid-keystroke, e.g. typing "123.5"
// getting padded to "123.50" before they've typed the second digit). Padding to 2
// decimals only happens once, on blur, via formatAmountForDisplay above.
const formatAmountLive = (raw: string): string => {
  const dotIndex = raw.indexOf(".");
  const intPart = dotIndex === -1 ? raw : raw.slice(0, dotIndex);
  const decPart = dotIndex === -1 ? "" : "." + raw.slice(dotIndex + 1).replace(/\./g, "");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return intFormatted + decPart;
};

const blankEntry = (warehouseId: string | number = ""): CheckOnHandType => ({
  warehouseid: String(warehouseId),
  customerid: "",
  checkno: "",
  checkamount: "",
  checkpostingdate: "",
  chkinvoiceno: "",
  customercheckdetailid: "",
});

const AddOnHandChequeModal = ({
  setShowPrintModal,
  triggerFetchSummary,
  editEntry,
}: {
  setShowPrintModal: (value: boolean) => void;
  triggerFetchSummary: () => Promise<void>;
  /** When set, the modal opens pre-populated with this single check, already in
   * edit mode, and hides the "Add Row" footer — used by the child grid's Edit action. */
  editEntry?: CheckOnHandType;
}) => {
  const { storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const isSingleEditMode = !!editEntry;

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
    watch,
    formState: { errors },
    getValues,
    setError,
  } = useForm<FormValues>({
    defaultValues: { entries: [editEntry ?? blankEntry()] },
    mode: "all",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "entries" });

  useEffect(() => {
    if (!defaultWarehouse?.warehouseid || isSingleEditMode) return;
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
  const [editIndex, setEditIndex] = useState<number | null>(isSingleEditMode ? 0 : null);

  const handleSave = async (index: number) => {
    const isValid = await trigger(`entries.${index}`);
    if (!isValid) return;

    const entry = getValues(`entries.${index}`);
    const allEntries = getValues("entries");

    // Same check # + same customer is only a true duplicate when it's also tagged to
    // the same invoice (or both left blank) — a big check covering several invoices is
    // deliberately entered as one row per invoice, all sharing the same physical check #.
    const isDuplicate = allEntries.some(
      (e, i) =>
        i !== index &&
        e.customerid === entry.customerid &&
        e.checkno === entry.checkno &&
        (e.chkinvoiceno || "") === (entry.chkinvoiceno || "")
    );
    if (isDuplicate) {
      setError(`entries.${index}.checkno`, {
        type: "manual",
        message: entry.chkinvoiceno
          ? "This check # is already entered for this invoice"
          : "Duplicate check# for same customer — tag each row to a different invoice to split it",
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateEntry: any = {
      customerid: Number(entry.customerid),
      // Defensive: strip any comma grouping in case this field was never focused/blurred
      // (e.g. only other fields were edited) and still holds the display-formatted text.
      checkamount: Number(String(entry.checkamount).replace(/,/g, "")),
      warehouseid: Number(entry.warehouseid),
      checkpostingdate: new Date(entry.checkpostingdate).toISOString(),
      checkno: entry.checkno,
      chkinvoiceno: entry.chkinvoiceno || null,
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

  // The row currently being worked on — whichever one is in edit mode, else the last
  // row (a freshly-added blank one is the one someone's about to fill in). Drives the
  // static "Open Invoices" reference panel, since only one customer's list can be shown
  // at a time regardless of how many rows exist.
  const activeIndex = editIndex ?? fields.length - 1;
  const activeCustomerId = watch(`entries.${activeIndex}.customerid`);

  const handlePickInvoice = (invoiceNumber: string) => {
    setValue(`entries.${activeIndex}.chkinvoiceno`, invoiceNumber, { shouldValidate: true });
  };

  return createPortal(
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 1180 }}>
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header py-3" style={{ borderBottom: "1px solid #e9ecef" }}>
            <h5 className="modal-title fw-semibold" style={{ fontSize: 15 }}>
              {isSingleEditMode ? "Edit Check" : "Add New Check"}
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

          {/* Body — left: the entries table, wrapped in a <form> (no submit handler/
              button; it's here purely so handleEnterAsTab's closest("form") lookup can
              find the row's fields). Right: a static reference panel, part of the form
              layout (not a popover/dropdown), listing the active row's customer's open
              invoices/balances so staff can look them up before typing an Invoice #. */}
          <div className="modal-body p-0 d-flex" style={{ maxHeight: "65vh" }}>
            <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
            <form onSubmit={(e) => e.preventDefault()}>
            <table className="table table-borderless mb-0" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "22%" }}>Customer</th>
                  <th style={{ ...thStyle, width: "15%" }}>Outlet</th>
                  <th style={{ ...thStyle, width: "12%" }}>Check No</th>
                  <th style={{ ...thStyle, width: "14%" }}>Amount</th>
                  <th style={{ ...thStyle, width: "12%" }}>Check Date</th>
                  <th style={{ ...thStyle, width: "14%" }}>Invoice #</th>
                  <th style={{ ...thStyle, width: "11%", textAlign: "center" }}>Actions</th>
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
                              outletId={parsedOutletId}
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
                          onKeyDown={handleEnterAsTab}
                        />
                        {rowErrors.checkno && (
                          <div className="invalid-feedback" style={{ fontSize: 10 }}>
                            {rowErrors.checkno.message}
                          </div>
                        )}
                      </td>

                      {/* Amount — uncontrolled input: the displayed text is written
                          straight to the DOM (comma-grouped live as the user types, then
                          padded to 2 decimals on blur), while RHF's tracked value is set
                          explicitly via setValue on every change rather than relying on
                          register's own onChange to read the (already-rewritten) DOM
                          value, which would depend on internal ordering we don't control. */}
                      <td style={tdStyle}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text" style={{ background: "#f8fafc", fontSize: 13 }}>$</span>
                          <input
                            disabled={!isEditable}
                            type="text"
                            inputMode="decimal"
                            defaultValue={formatAmountForDisplay(field.checkamount)}
                            className={`form-control form-control-sm${rowErrors.checkamount ? " is-invalid" : ""}`}
                            {...(() => {
                              const { name, ref } = register(`entries.${index}.checkamount`, { required: "Required" });
                              return { name, ref };
                            })()}
                            onChange={(e) => {
                              let raw = e.target.value.replace(/[^0-9.]/g, "");
                              const firstDot = raw.indexOf(".");
                              if (firstDot !== -1) {
                                raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, "");
                              }
                              e.target.value = formatAmountLive(raw);
                              setValue(`entries.${index}.checkamount`, raw, { shouldValidate: true });
                            }}
                            onBlur={(e) => {
                              const raw = getValues(`entries.${index}.checkamount`);
                              const n = Number(raw);
                              if (raw !== "" && Number.isFinite(n)) {
                                e.target.value = formatAmountForDisplay(n);
                              }
                            }}
                            onFocus={(e) => {
                              const current = getValues(`entries.${index}.checkamount`);
                              e.target.value = current != null && current !== "" ? String(current) : "";
                            }}
                            onKeyDown={handleEnterAsTab}
                          />
                        </div>
                        {rowErrors.checkamount && (
                          <div className="invalid-feedback d-block" style={{ fontSize: 10 }}>
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

                      {/* Invoice # — stays a plain optional text field, typed manually.
                          The full reference list of this customer's open invoices lives
                          in the static panel on the right, not a dropdown here (which
                          gets unusably long for a customer with many invoices). */}
                      <td style={tdStyle}>
                        <input
                          disabled={!isEditable}
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Optional"
                          {...register(`entries.${index}.chkinvoiceno`)}
                          onKeyDown={handleEnterAsTab}
                        />
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
                              <Save size={18} />
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
            </form>
            </div>

            {/* Static reference panel — always part of the layout, not a toggle/popover.
                Shows the active row's customer; a customer with many invoices scrolls
                inside this fixed-width column instead of blowing up a dropdown. */}
            <div
              style={{
                width: 300,
                flexShrink: 0,
                borderLeft: "1px solid #e9ecef",
                padding: 12,
                overflowY: "auto",
                background: "#fbfcfd",
              }}
            >
              {activeCustomerId ? (
                <CustomerOpenInvoicesPanel
                  storeId={parsedStoreId}
                  customerId={activeCustomerId}
                  onPick={handlePickInvoice}
                />
              ) : (
                <div style={{ fontSize: 12, color: "#94a3b8", padding: "8px 4px" }}>
                  Select a customer to see their open invoices here.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {!isSingleEditMode && (
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
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddOnHandChequeModal;
