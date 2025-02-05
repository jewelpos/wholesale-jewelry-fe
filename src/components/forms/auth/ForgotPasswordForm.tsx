"use client";

import { useAppDispatch } from "@/lib/store/hook";
import { emailValidation } from "@/lib/utils/validations/authValidations";
import { ForgotPasswordFormInput } from "@/types/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInput>({
    defaultValues: {
      email: "",
    },
    mode: "all",
  });

  const onSubmit = async (formData: ForgotPasswordFormInput) => {};

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="login-userset">
        <div className="login-userheading">
          <h3>Forgot password?</h3>
          <h4>
            If you forgot your password, well, then we’ll email you instructions
            to reset your password.
          </h4>
        </div>
        <div className="form-login">
          <label>Email</label>
          <div className="form-addons">
            <input
              type="text"
              className={`${errors.email && "is-invalid"}  form-control`}
              {...register("email", emailValidation)}
            />
            {!errors.email && (
              <Image
                src="/assets/img/icons/mail.svg"
                alt="form mail icon"
                width={13}
                height={10}
              />
            )}
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>
        </div>
        <div className="form-login">
          <button
            type="submit"
            // disabled={loginLoading}
            className="btn btn-login"
          >
            {/* {loginLoading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2" /> Signing in...
              </>
            ) : ( */}
            {"Sign in"}
            {/* )} */}
          </button>
        </div>
        <div className="signinform text-center">
          <h4>
            Return to
            <Link href="/jw/login" className="hover-a">
              {" "}
              login{" "}
            </Link>
          </h4>
        </div>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
