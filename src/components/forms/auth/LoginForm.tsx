"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { LoginFormInputs } from "@/types/auth";
import { emailOrUsernameValidation } from "@/lib/utils/validations/authValidations";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import Image from "next/image";

export const LoginForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "all",
  });
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  const onSubmit = async (formData: LoginFormInputs) => {
    setLoginLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
      }),
    });
    const data = await response.json();
    if (data.data) {
      if (data.success) {
        router.push("/jw/dashboard/admin");
      } else {
        const details = {
          email: formData.username,
        };
        const queryString = new URLSearchParams(details).toString();
        router.push(`/jw/verify?${queryString}`);
      }
      setLoginLoading(false);
    } else {
      setLoginLoading(false);
      const errorMessage =
        data?.graphQLErrors?.[0]?.message ||
        data?.networkError?.message ||
        "An unexpected error occurred. Please try again.";
      dispatch(
        showNotification({
          message: errorMessage,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="login-userset">
        <div className="login-userheading">
          <h3>Sign In</h3>
          <h4>Access the Dreamspos panel using your email and passcode.</h4>
        </div>
        <div className="form-login">
          <label className="form-label">Email Address</label>
          <div className="form-addons">
            <input
              type="text"
              className={`${errors.username && "is-invalid"}  form-control`}
              {...register("username", {
                required: "Email or username required",
                validate: emailOrUsernameValidation,
              })}
            />
            {!errors.username && (
              <Image
                src="/assets/img/icons/mail.svg"
                alt="form mail icon"
                width={13}
                height={10}
              />
            )}
            {errors.username && (
              <div className="invalid-feedback">{errors.username.message}</div>
            )}
          </div>
        </div>
        <div className="form-login">
          <label>Password</label>
          <div className="pass-group">
            <input
              type={`${isPasswordVisible ? "text" : "password"}`}
              className={`${
                errors.password && "is-invalid"
              }  pass-input form-control`}
              {...register("password")}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>
        </div>
        <div className="form-login authentication-check">
          <div className="row">
            <div className="col-6">
              <div className="custom-control custom-checkbox">
                <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                  <input
                    type="checkbox"
                    onChange={(e) => setPasswordVisible(e.target.checked)}
                  />
                  <span className="checkmarks" />
                  {isPasswordVisible ? "Hide password" : "Show password"}
                </label>
              </div>
            </div>
            <div className="col-6 text-end">
              <Link className="forgot-link" href="">
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
        <div className="form-login">
          <button
            type="submit"
            disabled={loginLoading}
            className="btn btn-login"
          >
            {loginLoading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2" /> Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
