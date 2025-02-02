"use client";

import { OtpForm } from "@/types/auth";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import OTP from "./OTP";

const OTPFormContainer = () => {
  const phoneOTPForm = useForm<OtpForm>({
    defaultValues: {
      otp: Array(6).fill(""),
    },
  });
  const phoneOTPValue = phoneOTPForm.watch("otp");

  const onPhoneOTPSubmit: SubmitHandler<OtpForm> = (data) => {
    const otp = data.otp.join("");
    console.log("OTP Submitted:", otp);
    // Add your submission logic here
  };

  return (
    <div className="login-userset">
      <div className="login-userheading">
        <h4 className="verfy-mail-content">
          We sent a verification code to your email and phone number. Enter the
          code in the fields below
        </h4>
      </div>
      <label className="form-label">Verify mobile</label>
      <OTP
        control={phoneOTPForm.control}
        setValue={phoneOTPForm.setValue}
        otpValue={phoneOTPValue}
        handleSubmit={phoneOTPForm.handleSubmit}
        onSubmit={onPhoneOTPSubmit}
      />
      <div className="form-login authentication-check">
        <div className="row">
          <div className="col-6"></div>
          <div className="col-6 text-end">
            <button className="btn btn-link">Resend OTP</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPFormContainer;
