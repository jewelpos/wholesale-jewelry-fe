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
import React, { useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import SelectWarehouse from "@/components/forms/SelectWarehouse";

const renderTooltip = (value: string) => (
  <Tooltip id="tooltip">{value}</Tooltip>
);

type FormValues = {
  entries: CheckOnHandType[];
};

const AddOnHandChequeModal = ({
  setShowPrintModal,
  triggerFetchSummary,
}: {
  setShowPrintModal: (value: boolean) => void;
  triggerFetchSummary: () => Promise<void>;
}) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const {
    control,
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isValid },
    getValues,
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      entries: [
        {
          warehouseid: "",
          customerid: "",
          checkno: "",
          checkamount: "",
          checkpostingdate: "",
          customercheckdetailid: "",
        },
      ],
    },
    mode: "all",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries",
  });
  const [createNewCheckOnHand] = useMutation(ADD_NEW_CHECK_ON_HAND_MUTATION);
  const [updateCheckOnHand] = useMutation(UPDATE_CHECK_ON_HAND_MUTATION);
  const [deleteCheckOnHand] = useMutation(DELETE_CHECK_ON_HAND_MUTATION);
  const dispatch = useAppDispatch();
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleNew = () => {
    append({
      warehouseid: "",
      customerid: "",
      checkno: "",
      checkamount: "",
      checkpostingdate: "",
      customercheckdetailid: "",
    });
  };

  const handleSave = async (index: number) => {
    const entry = getValues(`entries.${index}`);
    const allEntries = getValues("entries");

    // Check for duplicates in other rows
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
      checkpostingdate: entry.checkpostingdate,
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
        const successData =
          data.createNewCheckOnHand || data.updateNewCheckOnHand;
        if (!entry.customercheckdetailid) {
          setValue(
            `entries.${index}.customercheckdetailid`,
            successData.data.customercheckdetailid
          );
          handleNew();
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
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
  };

  const handleDelete = async (index: number) => {
    const result = await handleTryCatch(async () => {
      const response = await deleteCheckOnHand({
        variables: {
          customercheckdetailid: getValues(
            `entries.${index}.customercheckdetailid`
          ),
          storeid: parsedStoreId,
        },
      });
      setEditIndex(null);
      const { data } = response;
      if (data?.deleteCheckOnHand) {
        const successData = data.deleteCheckOnHand;
        remove(index);
        if (editIndex === index) setEditIndex(null);
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
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal ">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>Add Purchase</h4>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={() => {
                    triggerFetchSummary();
                    setShowPrintModal(false);
                  }}
                >
                  <span aria-hidden="true">X</span>
                </button>
              </div>
              <div className="modal-body custom-modal-body modal-height">
                {fields.map((field, index) => {
                  const isEditable =
                    (!!field.customercheckdetailid && editIndex === index) ||
                    field.customercheckdetailid === "";
                  const rowErrors = errors?.entries?.[index] || {};
                  return (
                    <div className="row" key={field.id}>
                      <div className="col-lg-2 col-md-4 col-sm-12">
                        <div className="input-blocks add-product">
                          <label>Customer</label>
                          <div className="row">
                            <div className="col-lg-12 col-sm-12 col-12">
                              <Controller
                                name={`entries.${index}.customerid`}
                                control={control}
                                rules={{ required: "Customer is required" }}
                                render={({ field }) => (
                                  <SelectCustomer
                                    className={`${
                                      rowErrors.customerid && "is-invalid"
                                    } `}
                                    storeId={parsedStoreId}
                                    trigger={trigger}
                                    disableField={!isEditable}
                                    {...field}
                                  />
                                )}
                              />
                              {rowErrors.customerid && (
                                <div className="invalid-feedback">
                                  {rowErrors.customerid.message}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-4 col-sm-12">
                        <div className="input-blocks add-product">
                          <label>Warehouse</label>
                          <div className="row">
                            <div className="col-lg-12 col-sm-12 col-12">
                              <Controller
                                name={`entries.${index}.warehouseid`}
                                control={control}
                                rules={{ required: "Warehouse is required" }}
                                disabled={!isEditable}
                                render={({ field }) => (
                                  <SelectWarehouse
                                    className={`${
                                      rowErrors.warehouseid && "is-invalid"
                                    } `}
                                    storeId={parsedStoreId}
                                    trigger={trigger}
                                    disableField={!isEditable}
                                    {...field}
                                  />
                                )}
                              />
                              {rowErrors.warehouseid && (
                                <div className="invalid-feedback">
                                  {rowErrors.warehouseid.message}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-2 col-md-4 col-sm-12">
                        <div className="input-blocks">
                          <label>Check No</label>
                          <div className="row">
                            <div className="col-lg-12 col-sm-12 col-12">
                              <input
                                disabled={!isEditable}
                                type="text"
                                className={`${
                                  rowErrors.checkno && "is-invalid"
                                }  form-control`}
                                {...register(`entries.${index}.checkno`, {
                                  required: "Check invoice no is required",
                                })}
                              />
                              {rowErrors.checkno && (
                                <div className="invalid-feedback">
                                  {rowErrors.checkno.message}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-1 col-md-4 col-sm-12">
                        <div className="input-blocks">
                          <label>Amount</label>
                          <div className="row">
                            <div className="col-lg-12 col-sm-12 col-12">
                              <input
                                disabled={!isEditable}
                                type="text"
                                className={`${
                                  rowErrors.checkamount && "is-invalid"
                                }  form-control`}
                                {...register(`entries.${index}.checkamount`, {
                                  required: "Amount is required",
                                })}
                              />
                              {rowErrors.checkamount && (
                                <div className="invalid-feedback">
                                  {rowErrors.checkamount.message}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-2 col-md-4 col-sm-12">
                        <div className="input-blocks">
                          <label>Purchase Date</label>
                          <div className="row">
                            <div className="col-lg-12 col-sm-12 col-12">
                              <input
                                disabled={!isEditable}
                                type="date"
                                className={`${
                                  rowErrors.checkpostingdate && "is-invalid"
                                }  form-control`}
                                {...register(
                                  `entries.${index}.checkpostingdate`,
                                  {
                                    required: "Check posting date is required",
                                  }
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-2 col-md-4 col-sm-12">
                        <div className="input-blocks">
                          <label>&nbsp;</label>
                          <div className="row">
                            <div className="col-lg-3 col-sm-3 col-3">
                              <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Save")}
                              >
                                <button
                                  type="button"
                                  className="btn btn-icon btn-success"
                                  onClick={() => handleSave(index)}
                                  disabled={!isEditable}
                                >
                                  <i className="fa-solid fa-save"></i>
                                </button>
                              </OverlayTrigger>
                            </div>

                            {field.customercheckdetailid && (
                              <>
                                <div className="col-lg-3 col-sm-3 col-3">
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Delete")}
                                  >
                                    <button
                                      className="btn btn-icon btn-danger"
                                      onClick={() => handleDelete(index)}
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </OverlayTrigger>
                                </div>
                                <div className="col-lg-3 col-sm-3 col-3">
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Edit")}
                                  >
                                    <button
                                      type="button"
                                      className="btn btn-icon btn-warning"
                                      onClick={() => handleEdit(index)}
                                    >
                                      <i className="fa-solid fa-pen"></i>
                                    </button>
                                  </OverlayTrigger>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOnHandChequeModal;
