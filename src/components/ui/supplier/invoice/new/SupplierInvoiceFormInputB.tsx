"use client";

import { SupplierInvoiceFormType } from "@/types/supplier";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import SelectPaymentTerms from "@/components/forms/SelectPaymentTerms";

interface Props {
  register: UseFormRegister<SupplierInvoiceFormType>;
  errors: FieldErrors<SupplierInvoiceFormType>;
  control: Control<SupplierInvoiceFormType>;
  trigger: UseFormTrigger<SupplierInvoiceFormType>;
  setValue: UseFormSetValue<SupplierInvoiceFormType>;
  storeId: number;
  disableField?: boolean;
}

export const SupplierInvoiceFormInputB = ({
  register,
  errors,
  control,
  trigger,
  setValue,
  storeId,
  disableField,
}: Props) => {
  return (
    <div className="row">
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Reference PO Number</label>
          <input
            type="number"
            className={`${errors.refponumber && "is-invalid"} form-control`}
            {...register("refponumber", {
              required: "Reference PO number is required",
              valueAsNumber: true,
            })}
          />
          {errors.refponumber && (
            <div className="invalid-feedback">{errors.refponumber.message}</div>
          )}
        </div>
      </div>
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Invoice Date</label>
          <input
            type="date"
            className={`${errors.veninvoicedate && "is-invalid"} form-control`}
            {...register("veninvoicedate", {
              required: "Invoice date is required",
            })}
          />
          {errors.veninvoicedate && (
            <div className="invalid-feedback">
              {errors.veninvoicedate.message}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Posting Date</label>
          <input
            type="date"
            className={`${errors.invpostingdate && "is-invalid"} form-control`}
            {...register("invpostingdate", {
              required: "Posting date is required",
            })}
          />
          {errors.invpostingdate && (
            <div className="invalid-feedback">
              {errors.invpostingdate.message}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-6 col-md-12">
        <div className="mb-3">
          <label className="form-label">Terms</label>
          <Controller
            name="termsid"
            control={control}
            rules={{ required: "Terms is required" }}
            render={({ field }) => (
              <SelectPaymentTerms
                className={`${errors.termsid && "is-invalid"} `}
                trigger={trigger}
                setValue={setValue}
                storeId={storeId}
                isDisabled={disableField}
                {...field}
              />
            )}
          />
          {errors.termsid && (
            <div className="invalid-feedback">{errors.termsid.message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierInvoiceFormInputB;
