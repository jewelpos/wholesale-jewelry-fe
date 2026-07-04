"use client";

import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidationCustomized } from "@/lib/utils/validations/formValidations";
import { SupplierFormType } from "@/types/supplier";
import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";
import SelectCountry from "@/components/forms/SelectCountry";
import { Building2, MapPin, User, Phone, type LucideIcon } from "lucide-react";

interface Props {
  register: UseFormRegister<SupplierFormType>;
  errors: FieldErrors<SupplierFormType>;
  control: Control<SupplierFormType>;
  trigger: UseFormTrigger<SupplierFormType>;
  supplierId: string | undefined;
  disableField?: boolean;
}

const SectionLabel = ({ label, icon: Icon }: { label: string; icon: LucideIcon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "20px 0 14px" }}>
    <Icon size={13} strokeWidth={2} color="#6c757d" />
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "#6c757d",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: "#dee2e6" }} />
  </div>
);

const SupplierInputsA = ({
  register,
  errors,
  control,
  trigger,
  supplierId,
  disableField,
}: Props) => {
  return (
    <>
      {/* Company */}
      <SectionLabel label="Company" icon={Building2} />
      <div className="row">
        {supplierId && (
          <div className="col-12 mb-3">
            <label className="form-label">Supplier ID #</label>
            <input
              type="text"
              className={`form-control${errors.supplierid ? " is-invalid" : ""}`}
              {...register("supplierid", { required: "Supplier id is required" })}
              disabled
            />
            {errors.supplierid && (
              <div className="invalid-feedback">{errors.supplierid.message}</div>
            )}
          </div>
        )}
        <div className="col-12 mb-3">
          <label className="form-label">Company Name <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control${errors.companyname ? " is-invalid" : ""}`}
            {...register("companyname", { required: "Company name is required" })}
          />
          {errors.companyname && (
            <div className="invalid-feedback">{errors.companyname.message}</div>
          )}
        </div>
      </div>

      {/* Address */}
      <SectionLabel label="Address" icon={MapPin} />
      <div className="row">
        <div className="col-12 mb-3">
          <label className="form-label">Street Address</label>
          <input
            type="text"
            className={`form-control${errors.address1 ? " is-invalid" : ""}`}
            {...register("address1")}
          />
          {errors.address1 && (
            <div className="invalid-feedback">{errors.address1.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">City <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control${errors.city ? " is-invalid" : ""}`}
            {...register("city", { required: "City is required" })}
          />
          {errors.city && (
            <div className="invalid-feedback">{errors.city.message}</div>
          )}
        </div>
        <div className="col-3 mb-3">
          <label className="form-label">State</label>
          <input
            type="text"
            className={`form-control${errors.state ? " is-invalid" : ""}`}
            {...register("state")}
          />
          {errors.state && (
            <div className="invalid-feedback">{errors.state.message}</div>
          )}
        </div>
        <div className="col-3 mb-3">
          <label className="form-label">Zip</label>
          <input
            type="text"
            className={`form-control${errors.zipcode ? " is-invalid" : ""}`}
            {...register("zipcode")}
          />
          {errors.zipcode && (
            <div className="invalid-feedback">{errors.zipcode.message}</div>
          )}
        </div>
        <div className="col-12 mb-3">
          <label className="form-label">Country</label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <SelectCountry
                className={errors.country ? "is-invalid" : ""}
                trigger={trigger}
                disableField={disableField}
                {...field}
              />
            )}
          />
          {errors.country && (
            <div className="invalid-feedback">{errors.country.message}</div>
          )}
        </div>
      </div>

      {/* Contact Person */}
      <SectionLabel label="Contact Person" icon={User} />
      <div className="row">
        <div className="col-12 mb-3">
          <label className="form-label">Contact Name <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control${errors.contactperson1 ? " is-invalid" : ""}`}
            {...register("contactperson1", { required: "Contact person is required" })}
          />
          {errors.contactperson1 && (
            <div className="invalid-feedback">{errors.contactperson1.message}</div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <SectionLabel label="Contact Info" icon={Phone} />
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Phone <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control${errors.phone1 ? " is-invalid" : ""}`}
            {...register("phone1", phoneNumberValidationCustomized("Phone is required"))}
          />
          {errors.phone1 && (
            <div className="invalid-feedback">{errors.phone1.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Cell Phone</label>
          <input
            type="text"
            className={`form-control${errors.cellphone ? " is-invalid" : ""}`}
            {...register("cellphone", phoneNumberValidationCustomized(""))}
          />
          {errors.cellphone && (
            <div className="invalid-feedback">{errors.cellphone.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Email <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control${errors.emailaddress ? " is-invalid" : ""}`}
            {...register("emailaddress", emailValidation)}
          />
          {errors.emailaddress && (
            <div className="invalid-feedback">{errors.emailaddress.message}</div>
          )}
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Website</label>
          <input
            type="text"
            className={`form-control${errors.webaddress ? " is-invalid" : ""}`}
            {...register("webaddress")}
          />
          {errors.webaddress && (
            <div className="invalid-feedback">{errors.webaddress.message}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default SupplierInputsA;
