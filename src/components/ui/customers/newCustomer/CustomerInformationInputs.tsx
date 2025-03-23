"use client";

import { emailValidation } from "@/lib/utils/validations/authValidations";
import { phoneNumberValidation } from "@/lib/utils/validations/formValidations";
import { NewCustomerFormType } from "@/types/customer";
import { DatePicker } from "antd";
import React from "react";
import { Info, PlusCircle } from "react-feather";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";

interface Props {
  register: UseFormRegister<NewCustomerFormType>;
  errors: FieldErrors<NewCustomerFormType>;
  control: Control<NewCustomerFormType>;
}

const CustomerInformationInputs = ({ register, errors, control }: Props) => {
  return (
    <>
      <div className="card-title-head">
        <h6>
          <span>
            <Info className="feather-edit" />
          </span>
          Customer Information
        </h6>
      </div>
      <div className="profile-pic-upload">
        <div className="profile-pic">
          <span>
            <PlusCircle className="plus-down-add" />
            Profile Photo
          </span>
        </div>
        <div className="input-blocks mb-0">
          <div className="image-upload mb-0">
            <input
              type="file"
              className={`${
                errors.custphotopath && "is-invalid"
              }  form-control`}
              {...register("custphotopath")}
            />
            <div className="image-uploads">
              <h4>Change image</h4>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">First name</label>
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
            <label className="form-label">Last name</label>
            <input
              type="text"
              className={`${errors.custlname && "is-invalid"}  form-control`}
              {...register("custlname", {
                required: "Last name is required",
              })}
            />
            {errors.custlname && (
              <div className="invalid-feedback">{errors.custlname.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              type="text"
              className={`${errors.custtitle && "is-invalid"}  form-control`}
              {...register("custtitle", {
                required: "Title is required",
              })}
            />
            {errors.custtitle && (
              <div className="invalid-feedback">{errors.custtitle.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="input-blocks">
            <label>Date of Birth</label>
            <div className="input-groupicon calender-input">
              <Controller
                name="custdob"
                control={control}
                rules={{ required: "DOB is required" }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    type="date"
                    className="filterdatepicker"
                    onChange={(date) => field.onChange(date)}
                    placeholder="Choose Date"
                    status={errors.custdob ? "error" : ""}
                  />
                )}
              />
              {errors.custdob && (
                <div className="invalid-feedback">{errors.custdob.message}</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className={`${errors.custphone1 && "is-invalid"}  form-control`}
              {...register("custphone1", phoneNumberValidation)}
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
            <label className="form-label">Fax</label>
            <input
              type="text"
              className={`${errors.custfax && "is-invalid"}  form-control`}
              {...register("custfax", {
                required: "Fax is required",
              })}
            />
            {errors.custfax && (
              <div className="invalid-feedback">{errors.custfax.message}</div>
            )}
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="mb-3">
            <label className="form-label">Cell phone</label>
            <input
              type="text"
              className={`${errors.custcell && "is-invalid"}  form-control`}
              {...register("custcell", {
                required: "Cell phone is required",
              })}
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
      </div>
    </>
  );
};

export default CustomerInformationInputs;
