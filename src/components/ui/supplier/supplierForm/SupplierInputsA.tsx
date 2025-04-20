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

interface Props {
  register: UseFormRegister<SupplierFormType>;
  errors: FieldErrors<SupplierFormType>;
  control: Control<SupplierFormType>;
  trigger: UseFormTrigger<SupplierFormType>;
  supplierId: string | undefined;
  disableField?: boolean;
}

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
      <div className="row">
        {supplierId && (
          <div className="col-lg-6 col-md-12">
            <div className="mb-3">
              <label className="form-label">Supplier id #</label>
              <input
                type="text"
                className={`${errors.supplierid && "is-invalid"}  form-control`}
                {...register("supplierid", {
                  required: "Supplier id is required",
                })}
                disabled
              />
              {errors.supplierid && (
                <div className="invalid-feedback">
                  {errors.supplierid.message}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Company name</label>
            <input
              type="text"
              className={`${errors.companyname && "is-invalid"}  form-control`}
              {...register("companyname", {
                required: "Company name is required",
              })}
            />
            {errors.companyname && (
              <div className="invalid-feedback">
                {errors.companyname.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className={`${errors.address1 && "is-invalid"}  form-control`}
              {...register("address1")}
            />
            {errors.address1 && (
              <div className="invalid-feedback">{errors.address1.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">City</label>
            <input
              type="text"
              className={`${errors.city && "is-invalid"}  form-control`}
              {...register("city", {
                required: "City is required",
              })}
            />
            {errors.city && (
              <div className="invalid-feedback">{errors.city.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">State</label>
            <input
              type="text"
              className={`${errors.state && "is-invalid"}  form-control`}
              {...register("state")}
            />
            {errors.state && (
              <div className="invalid-feedback">{errors.state.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Zipcode</label>
            <input
              type="text"
              className={`${errors.zipcode && "is-invalid"}  form-control`}
              {...register("zipcode")}
            />
            {errors.zipcode && (
              <div className="invalid-feedback">{errors.zipcode.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Country</label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <SelectCountry
                  className={`${errors.country && "is-invalid"} `}
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
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className={`${
                errors.contactperson1 && "is-invalid"
              }  form-control`}
              {...register("contactperson1", {
                required: "Contact person is required",
              })}
            />
            {errors.contactperson1 && (
              <div className="invalid-feedback">
                {errors.contactperson1.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className={`${errors.phone1 && "is-invalid"}  form-control`}
              {...register(
                "phone1",
                phoneNumberValidationCustomized("Phone is required")
              )}
            />
            {errors.phone1 && (
              <div className="invalid-feedback">{errors.phone1.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Cell Phone</label>
            <input
              type="text"
              className={`${errors.cellphone && "is-invalid"}  form-control`}
              {...register("cellphone", phoneNumberValidationCustomized(""))}
            />
            {errors.cellphone && (
              <div className="invalid-feedback">{errors.cellphone.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="text"
              className={`${errors.emailaddress && "is-invalid"}  form-control`}
              {...register("emailaddress", emailValidation)}
            />
            {errors.emailaddress && (
              <div className="invalid-feedback">
                {errors.emailaddress.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6 col-md-12">
          <div className="mb-3">
            <label className="form-label">Web Address</label>
            <input
              type="text"
              className={`${errors.webaddress && "is-invalid"}  form-control`}
              {...register("webaddress")}
            />
            {errors.webaddress && (
              <div className="invalid-feedback">
                {errors.webaddress.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierInputsA;
