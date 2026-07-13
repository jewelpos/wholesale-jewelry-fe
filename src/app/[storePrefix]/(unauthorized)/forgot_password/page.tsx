import ForgotPasswordForm from "@/components/forms/auth/ForgotPasswordForm";
import Logo from "@/components/ui/Logo";
import Image from "next/image";
import { MessageSquare, Mail } from "react-feather";

const ForgotPasswordPage = () => {
  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper login-split">

          {/* Left panel: form */}
          <div className="login-split-form">
            <div className="login-split-inner">
              <div className="login-logo mb-4">
                <Logo width={787} height={225} style={{ width: "100%", maxWidth: 360, height: "auto" }} />
              </div>
              <ForgotPasswordForm />
            </div>
          </div>

          {/* Right panel: brand */}
          <div className="login-split-brand d-none d-lg-flex">
            <div className="login-brand-overlay">
              <div className="login-brand-content">
                <div className="login-brand-logo mb-0">
                  <Image
                    src="/assets/img/logo.webp"
                    alt="JewelPOS"
                    width={787}
                    height={225}
                    style={{ width: "100%", maxWidth: 300, height: "auto" }}
                    priority
                  />
                </div>
                <p className="login-brand-tagline">Let the system work for you!</p>
                <div className="login-brand-divider mb-4" />
                <h2 className="login-brand-headline">Smart. Scalable.<br />Built for Modern Wholesale.</h2>
                <div className="login-brand-contact" style={{ marginTop: 40 }}>
                  <p className="login-brand-contact-label">Need help? Contact support</p>
                  <div className="login-brand-contact-items">
                    <a href="sms:+18005539367" className="login-brand-contact-item">
                      <MessageSquare size={14} /><span>SMS: +1 800-JEWELPOS</span>
                    </a>
                    <a href="mailto:support@jewelpos.com" className="login-brand-contact-item">
                      <Mail size={14} /><span>support@jewelpos.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
