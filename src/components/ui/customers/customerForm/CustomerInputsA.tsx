"use client";

import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidationCustomized } from "@/lib/utils/validations/formValidations";
import { CustomerFormType } from "@/types/customer";
import React from "react";
import { PlusCircle } from "react-feather";
import Image from "next/image";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import SelectCountry from "@/components/forms/SelectCountry";

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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setValue("custphotopath", url);
      trigger("custphotopath");
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-lg-8 col-md-6">
          <div className="row">
            {customerId && (
              <div className="col-lg-12 col-md-12">
                <div className="mb-3">
                  <label className="form-label">Customer id #</label>
                  <input
                    type="text"
                    className={`${
                      errors.customerid && "is-invalid"
                    }  form-control`}
                    {...register("customerid", {
                      required: "Customer id is required",
                    })}
                    disabled
                  />
                  {errors.customerid && (
                    <div className="invalid-feedback">
                      {errors.customerid.message}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="col-lg-12 col-md-12">
              <div className="mb-3">
                <label className="form-label">Company name</label>
                <input
                  type="text"
                  className={`${
                    errors.custcompanyname && "is-invalid"
                  }  form-control`}
                  {...register("custcompanyname", {
                    required: "Company name is required",
                  })}
                />
                {errors.custcompanyname && (
                  <div className="invalid-feedback">
                    {errors.custcompanyname.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-12">
              <div className="mb-3">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className={`${errors.custadd1 && "is-invalid"}  form-control`}
                  {...register("custadd1", {
                    required: "Address is required",
                  })}
                />
                {errors.custadd1 && (
                  <div className="invalid-feedback">
                    {errors.custadd1.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-12">
              <div className="mb-3">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className={`${errors.custcity && "is-invalid"}  form-control`}
                  {...register("custcity", {
                    required: "City is required",
                  })}
                />
                {errors.custcity && (
                  <div className="invalid-feedback">
                    {errors.custcity.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="mb-3">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className={`${
                    errors.custstate && "is-invalid"
                  }  form-control`}
                  {...register("custstate", {
                    required: "State is required",
                  })}
                />
                {errors.custstate && (
                  <div className="invalid-feedback">
                    {errors.custstate.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-2 col-md-6">
              <div className="mb-3">
                <label className="form-label">Zipcode</label>
                <input
                  type="text"
                  className={`${errors.custzip && "is-invalid"}  form-control`}
                  {...register("custzip", {
                    required: "Zipcode is required",
                  })}
                />
                {errors.custzip && (
                  <div className="invalid-feedback">
                    {errors.custzip.message}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="mb-3">
                <label className="form-label">Country</label>
                <Controller
                  name="custcountry"
                  control={control}
                  rules={{ required: "Country is required" }}
                  render={({ field }) => (
                    <SelectCountry
                      className={`${errors.custcountry && "is-invalid"} `}
                      trigger={trigger}
                      disableField={disableField}
                      {...field}
                    />
                  )}
                />
                {errors.custcountry && (
                  <div className="invalid-feedback">
                    {errors.custcountry.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 d-flex justify-content-center align-items-center">
          <div className="profile-pic-upload text-center">
            <div className="profile-pic">
              {!photoPath && (
                <span>
                  <PlusCircle className="plus-down-add" />
                  Profile Photo
                </span>
              )}
              {photoPath && (
                <Image
                  src={photoPath}
                  unoptimized
                  alt="Preview"
                  width={100}
                  height={100}
                />
              )}
            </div>
            {!disableField && (
              <div className="input-blocks mb-0">
                <div className="image-upload mb-0">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment" // opens camera on mobile
                    {...register("file")}
                    onChange={handleFileChange}
                  />
                  <div className="image-uploads">
                    <h4>Change image</h4>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Store phone</label>
            <input
              type="text"
              className={`${errors.custphone1 && "is-invalid"}  form-control`}
              {...register(
                "custphone1",
                phoneNumberValidationCustomized("Store phone is required")
              )}
            />
            {errors.custphone1 && (
              <div className="invalid-feedback">
                {errors.custphone1.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Cell phone</label>
            <input
              type="text"
              className={`${errors.custcell && "is-invalid"}  form-control`}
              {...register(
                "custcell",
                phoneNumberValidationCustomized("Cell phone is required")
              )}
            />
            {errors.custcell && (
              <div className="invalid-feedback">{errors.custcell.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="text"
              className={`${errors.custemailadd && "is-invalid"}  form-control`}
              {...register("custemailadd", emailValidation)}
            />
            {errors.custemailadd && (
              <div className="invalid-feedback">
                {errors.custemailadd.message}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">First Name</label>
            <input
              type="text"
              className={`${errors.custfname && "is-invalid"}  form-control`}
              {...register("custfname", {
                required: "First name is required",
              })}
            />
            {errors.custfname && (
              <div className="invalid-feedback">{errors.custfname.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              className={`form-control`}
              {...register("custlname")}
            />
            {errors.custlname && (
              <div className="invalid-feedback">{errors.custlname.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Alternate phone number</label>
            <input
              type="text"
              className={`${errors.custphone2 && "is-invalid"}  form-control`}
              {...register("custphone2", phoneNumberValidationCustomized(""))}
            />
            {errors.custphone2 && (
              <div className="invalid-feedback">
                {errors.custphone2.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerInputsA;
