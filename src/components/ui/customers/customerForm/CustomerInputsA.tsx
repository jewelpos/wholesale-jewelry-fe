"use client";

import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidationCustomized } from "@/lib/utils/validations/formValidations";
import { CustomerFormType } from "@/types/customer";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import SelectCountry from "@/components/forms/SelectCountry";
import ImageCaptureUpload from "@/components/ui/common/ImageCaptureUpload";

interface Props {
  register: UseFormRegister<CustomerFormType>;
  errors: FieldErrors<CustomerFormType>;
  control: Control<CustomerFormType>;
  trigger: UseFormTrigger<CustomerFormType>;
  setValue: UseFormSetValue<CustomerFormType>;
  photoPath: string;
  customerId: string | undefined;
  disableField?: boolean;
}

const SectionLabel = ({ label }: { label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 14px" }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#adb5bd", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: "#e9ecef" }} />
  </div>
);

const CustomerInputsA = ({
  register,
  errors,
  control,
  trigger,
  setValue,
  photoPath,
  customerId,
  disableField,
}: Props) => {
  return (
    <>
      {/* Photo */}
      <div className="d-flex justify-content-center mb-3">
        <Controller
          name="file"
          control={control}
          render={({ field }) => (
            <ImageCaptureUpload
              value={field.value || photoPath || null}
              onChange={(img) => {
                field.onChange(img);
                if (typeof img === "string") {
                  setValue("custphotopath", img);
                } else if (img instanceof File) {
                  setValue("custphotopath", URL.createObjectURL(img));
                }
                trigger("custphotopath");
              }}
              label="Profile Photo"
              disabled={!!disableField}
            />
          )}
        />
      </div>

      {/* Company */}
      <SectionLabel label="Company" />
      <div className="row">
        {customerId && (
          <div className="col-12 mb-3">
            <label className="form-label">Customer ID #</label>
            <input
              type="text"
              className={`form-control${errors.customerid ? " is-invalid" : ""}`}
              {...register("customerid", { required: "Customer id is required" })}
              disabled
            />
            {errors.customerid && (
              <div className="invalid-feedback">{errors.customerid.message}</div>
            )}
          </div>
        )}
        <div className="col-12 mb-3">
          <label className="form-label">Company Name</label>
          <input
            type="text"
            className={`form-control${errors.custcompanyname ? " is-invalid" : ""}`}
            {...register("custcompanyname", { required: "Company name is required" })}
          />
          {errors.custcompanyname && (
            <div className="invalid-feedback">{errors.custcompanyname.message}</div>
          )}
        </div>
      </div>

      {/* Address */}
      <SectionLabel label="Address" />
      <div className="row">
        <div className="col-12 mb-3">
          <label className="form-label">Street Address</label>
          <input
            type="text"
            className={`form-control${errors.custadd1 ? " is-invalid" : ""}`}
            {...register("custadd1", { required: "Address is required" })}
          />
          {errors.custadd1 && (
            <div className="invalid-feedback">{errors.custadd1.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">City</label>
          <input
            type="text"
            className={`form-control${errors.custcity ? " is-invalid" : ""}`}
            {...register("custcity", { required: "City is required" })}
          />
          {errors.custcity && (
            <div className="invalid-feedback">{errors.custcity.message}</div>
          )}
        </div>
        <div className="col-3 mb-3">
          <label className="form-label">State</label>
          <input
            type="text"
            className={`form-control${errors.custstate ? " is-invalid" : ""}`}
            {...register("custstate", { required: "State is required" })}
          />
          {errors.custstate && (
            <div className="invalid-feedback">{errors.custstate.message}</div>
          )}
        </div>
        <div className="col-3 mb-3">
          <label className="form-label">Zip</label>
          <input
            type="text"
            className={`form-control${errors.custzip ? " is-invalid" : ""}`}
            {...register("custzip", { required: "Zipcode is required" })}
          />
          {errors.custzip && (
            <div className="invalid-feedback">{errors.custzip.message}</div>
          )}
        </div>
        <div className="col-12 mb-3">
          <label className="form-label">Country</label>
          <Controller
            name="custcountry"
            control={control}
            rules={{ required: "Country is required" }}
            render={({ field }) => (
              <SelectCountry
                className={errors.custcountry ? "is-invalid" : ""}
                trigger={trigger}
                disableField={disableField}
                {...field}
              />
            )}
          />
          {errors.custcountry && (
            <div className="invalid-feedback">{errors.custcountry.message}</div>
          )}
        </div>
      </div>

      {/* Contact Person */}
      <SectionLabel label="Contact Person" />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">First Name</label>
          <input
            type="text"
            className={`form-control${errors.custfname ? " is-invalid" : ""}`}
            {...register("custfname", { required: "First name is required" })}
          />
          {errors.custfname && (
            <div className="invalid-feedback">{errors.custfname.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Last Name</label>
          <input type="text" className="form-control" {...register("custlname")} />
        </div>
      </div>

      {/* Contact Info */}
      <SectionLabel label="Contact Info" />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Store Phone</label>
          <input
            type="text"
            className={`form-control${errors.custphone1 ? " is-invalid" : ""}`}
            {...register("custphone1", phoneNumberValidationCustomized("Store phone is required"))}
          />
          {errors.custphone1 && (
            <div className="invalid-feedback">{errors.custphone1.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Cell Phone</label>
          <input
            type="text"
            className={`form-control${errors.custcell ? " is-invalid" : ""}`}
            {...register("custcell", phoneNumberValidationCustomized("Cell phone is required"))}
          />
          {errors.custcell && (
            <div className="invalid-feedback">{errors.custcell.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Alternate Phone</label>
          <input
            type="text"
            className={`form-control${errors.custphone2 ? " is-invalid" : ""}`}
            {...register("custphone2", phoneNumberValidationCustomized(""))}
          />
          {errors.custphone2 && (
            <div className="invalid-feedback">{errors.custphone2.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Email</label>
          <input
            type="text"
            className={`form-control${errors.custemailadd ? " is-invalid" : ""}`}
            {...register("custemailadd", emailValidation)}
          />
          {errors.custemailadd && (
            <div className="invalid-feedback">{errors.custemailadd.message}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerInputsA;
