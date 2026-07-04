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
import AvatarUpload from "@/components/ui/common/AvatarUpload";
import { Building2, MapPin, User, Phone, type LucideIcon } from "lucide-react";

interface Props {
  register: UseFormRegister<CustomerFormType>;
  errors: FieldErrors<CustomerFormType>;
  control: Control<CustomerFormType>;
  trigger: UseFormTrigger<CustomerFormType>;
  setValue: UseFormSetValue<CustomerFormType>;
  photoPath: string;
  customerId: string | undefined;
  companyName?: string;
  disableField?: boolean;
}

const SectionLabel = ({ label, icon: Icon }: { label: string; icon: LucideIcon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "20px 0 14px" }}>
    <Icon size={13} strokeWidth={2} color="#6c757d" />
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#6c757d", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: "#dee2e6" }} />
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
  companyName,
  disableField,
}: Props) => {
  return (
    <>
      {/* Photo */}
      <Controller
        name="file"
        control={control}
        render={({ field }) => (
          <AvatarUpload
            value={field.value || photoPath || null}
            name={companyName}
            disabled={!!disableField}
            onChange={(file) => {
              field.onChange(file);
              if (file instanceof File) {
                setValue("custphotopath", URL.createObjectURL(file));
              }
              trigger("custphotopath");
            }}
          />
        )}
      />

      {/* Company */}
      <SectionLabel label="Company" icon={Building2} />
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
          <label className="form-label">Company Name <span className="text-danger">*</span></label>
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
      <SectionLabel label="Address" icon={MapPin} />
      <div className="row">
        <div className="col-12 mb-3">
          <label className="form-label">Street Address <span className="text-danger">*</span></label>
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
          <label className="form-label">City <span className="text-danger">*</span></label>
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
          <label className="form-label">State <span className="text-danger">*</span></label>
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
          <label className="form-label">Zip <span className="text-danger">*</span></label>
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
          <label className="form-label">Country <span className="text-danger">*</span></label>
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
      <SectionLabel label="Contact Person" icon={User} />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">First Name <span className="text-danger">*</span></label>
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
      <SectionLabel label="Contact Info" icon={Phone} />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Store Phone <span className="text-danger">*</span></label>
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
          <label className="form-label">Cell Phone <span className="text-danger">*</span></label>
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
          <label className="form-label">Email <span className="text-danger">*</span></label>
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
