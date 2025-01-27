"use client";

import { OtpForm } from "@/types/auth";
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import OTP from "./OTP";

type Props = {};

const OTPFormContainer = (props: Props) => {
  const emailOTPForm = useForm<OtpForm>({
    defaultValues: {
      otp: Array(6).fill(""),
    },
  });
  const phoneOTPForm = useForm<OtpForm>({
    defaultValues: {
      otp: Array(6).fill(""),
    },
  });
  const emailOTPRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailOTPValue = emailOTPForm.watch("otp");
  const phoneOTPRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneOTPValue = phoneOTPForm.watch("otp");

  const onEmailOTPSubmit = async (data: OtpForm) => {
    const otp = data.otp.join("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        otp,
      }),
    });
  };

  const onPhoneOTPSubmit = (data: OtpForm) => {
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
      <label className="form-label">Verify email</label>
      <OTP
        control={emailOTPForm.control}
        otpRefs={emailOTPRefs}
        setValue={emailOTPForm.setValue}
        otpValue={emailOTPValue}
        handleSubmit={emailOTPForm.handleSubmit}
        onSubmit={onEmailOTPSubmit}
      />
      <div className="form-login authentication-check">
        <div className="row">
          <div className="col-6"></div>
          <div className="col-6 text-end">
            <button className="btn btn-link">Resend OTP</button>
          </div>
        </div>
      </div>
      <label className="form-label">Verify mobile</label>
      <OTP
        control={phoneOTPForm.control}
        otpRefs={phoneOTPRefs}
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
