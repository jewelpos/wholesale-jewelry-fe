import OTPFormContainer from "@/components/forms/auth/OTPFormContainer";
import Logo from "@/components/ui/Logo";
import LogoWhite from "@/components/ui/LogoWhite";
import Link from "next/link";

const VerifyPage = () => {
  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper login-new">
          <div className="container">
            <div className="login-content user-login">
              <div className="login-logo">
                <Logo />
                <Link href="#" className="login-logo logo-white">
                  <LogoWhite />
                </Link>
              </div>
              <OTPFormContainer />
            </div>
            <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
              <p>Copyright © 2023 DreamsPOS. All rights reserved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
