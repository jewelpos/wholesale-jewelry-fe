"use client";

import { OtpForm } from "@/types/auth";
import React, { useEffect, useRef } from "react";
import {
  Control,
  Controller,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormSetValue,
} from "react-hook-form";

type Props = {
  control: Control<OtpForm>;
  setValue: UseFormSetValue<OtpForm>;
  otpValue: string[];
  handleSubmit: UseFormHandleSubmit<OtpForm>;
  onSubmit: SubmitHandler<OtpForm>;
};

const OTP = ({
  control,
  setValue,
  otpValue,
  handleSubmit,
  onSubmit,
}: Props) => {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;

    if (/^\d$/.test(value)) {
      setValue(`otp.${index}`, value, { shouldValidate: true }); // Update the value
      if (index < 5) otpRefs.current[index + 1]?.focus();
    } else if (value === "") {
      setValue(`otp.${index}`, ""); // Clear value on backspace
    }
  };

  const handleBackspace = (index: number) => {
    if (index > 0) otpRefs.current[index - 1]?.focus();
  };

  useEffect(() => {
    if (otpValue.every((digit) => digit)) {
      handleSubmit(onSubmit)();
    }
  });

  return (
    <form className="digit-group">
      <div className="wallet-add">
        <div className="otp-box">
          <div className="forms-block text-center">
            {[...Array(6)].map((_, index) => (
              <Controller
                key={index}
                name={`otp.${index}`}
                control={control}
                rules={{
                  required: "This field is required",
                  validate: (value) =>
                    /^\d$/.test(value) || "Only digits are allowed",
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    ref={(el: HTMLInputElement | null) => {
                      otpRefs.current[index] = el; // Assign the element to the ref
                    }}
                    maxLength={1}
                    id={`digit-${index}`}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !field.value) {
                        handleBackspace(index);
                      }
                    }}
                    type="text"
                  />
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

export default OTP;
