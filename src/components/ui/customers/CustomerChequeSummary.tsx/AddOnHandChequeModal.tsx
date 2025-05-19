"use client";

import SelectCustomer from "@/components/forms/SelectCustomer";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { ADD_NEW_CHECK_ON_HAND_MUTATION } from "@/lib/graphql/mutations/customer";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { AddNewCheckOnHandType } from "@/types/customer";
import { useMutation } from "@apollo/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { PlusCircle } from "react-feather";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import ButtonLoader from "../../ButtonLoader";
import SelectWarehouse from "@/components/forms/SelectWarehouse";

const renderTooltip = (value: string) => (
  <Tooltip id="tooltip">{value}</Tooltip>
);

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
    formState: { errors, isValid },
  } = useForm<{
    rows: AddNewCheckOnHandType[];
  }>({
    defaultValues: {
      rows: [
        {
          warehouseid: "",
          customerid: "",
          checkno: "",
          checkamount: "",
          checkpostingdate: "",
        },
      ],
    },
    mode: "all",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rows",
  });
  const [createNewCheckOnHand, { loading: createLoading }] = useMutation(
    ADD_NEW_CHECK_ON_HAND_MUTATION
  );
  const dispatch = useAppDispatch();

  const handleNew = () => {
    trigger();
    append({
      warehouseid: "",
      customerid: "",
      checkno: "",
      checkamount: "",
      checkpostingdate: "",
    });
  };

  const handleSave = async (payload: { rows: AddNewCheckOnHandType[] }) => {
    const updatedPayload = payload.rows.map((row) => ({
      customerid: Number(row.customerid),
      warehouseid: Number(row.warehouseid),
      checkno: row.checkno,
      checkamount: Number(row.checkamount),
      checkpostingdate: new Date(row.checkpostingdate).toISOString(),
    }));
    const result = await handleTryCatch(
      async () => {
        const response = await createNewCheckOnHand({
          variables: { input: updatedPayload, storeid: parsedStoreId },
        });

        const { data } = response;
        if (data?.createNewCheckOnHand) {
          const successData = data.createNewCheckOnHand;
          dispatch(
            showNotification({
              message: successData.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
        }
        return true;
      },
      () => {
        triggerFetchSummary();
        setShowPrintModal(false);
      }
    );

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  const handleDelete = (index: number) => {
    remove(index);
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
                  onClick={() => setShowPrintModal(false)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <form onSubmit={handleSubmit(handleSave)}>
                <div className="modal-body custom-modal-body modal-height">
                  {fields.map((field, index) => {
                    const rowErrors = errors?.rows?.[index] || {};
                    return (
                      <div className="row" key={field.id}>
                        <div className="col-lg-2 col-md-4 col-sm-12">
                          <div className="input-blocks add-product">
                            <label>Customer</label>
                            <div className="row">
                              <div className="col-lg-12 col-sm-12 col-12">
                                <Controller
                                  name={`rows.${index}.customerid`}
                                  control={control}
                                  rules={{ required: "Customer is required" }}
                                  render={({ field }) => (
                                    <SelectCustomer
                                      className={`${
                                        rowErrors.customerid && "is-invalid"
                                      } `}
                                      storeId={parsedStoreId}
                                      trigger={trigger}
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
                                  name={`rows.${index}.warehouseid`}
                                  control={control}
                                  rules={{ required: "Warehouse is required" }}
                                  render={({ field }) => (
                                    <SelectWarehouse
                                      className={`${
                                        rowErrors.warehouseid && "is-invalid"
                                      } `}
                                      storeId={parsedStoreId}
                                      trigger={trigger}
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
                                  type="text"
                                  className={`${
                                    rowErrors.checkno && "is-invalid"
                                  }  form-control`}
                                  {...register(`rows.${index}.checkno`, {
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
                                  type="text"
                                  className={`${
                                    rowErrors.checkamount && "is-invalid"
                                  }  form-control`}
                                  {...register(`rows.${index}.checkamount`, {
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
                                  type="date"
                                  className={`${
                                    rowErrors.checkpostingdate && "is-invalid"
                                  }  form-control`}
                                  {...register(
                                    `rows.${index}.checkpostingdate`,
                                    {
                                      required:
                                        "Check posting date is required",
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
                                  overlay={renderTooltip("Delete")}
                                >
                                  <button
                                    className="btn btn-icon btn-danger"
                                    onClick={() => handleDelete(index)}
                                    disabled={fields.length < 2}
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </OverlayTrigger>
                              </div>
                              {fields.length === index + 1 && (
                                <div className="col-lg-3 col-sm-3 col-3">
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip("Add")}
                                  >
                                    <button
                                      type="button"
                                      className="btn btn-icon btn-info"
                                      onClick={handleNew}
                                    >
                                      <i className="fa-solid fa-plus"></i>
                                    </button>
                                  </OverlayTrigger>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-cancel"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                  <ButtonLoader
                    loading={createLoading}
                    btnText="Save"
                    loadingText="Saving ..."
                    disabled={!isValid}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOnHandChequeModal;
