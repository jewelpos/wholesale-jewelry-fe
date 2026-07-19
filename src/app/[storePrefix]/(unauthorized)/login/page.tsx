import { LoginForm } from "@/components/forms/auth/LoginForm";
import Logo from "@/components/ui/Logo";
import Image from "next/image";
import { MessageSquare, Mail } from "react-feather";

const LoginPage = () => {
  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper login-split">

          {/* ── Left panel: form ── */}
          <div className="login-split-form">
            <div className="login-split-inner">
              <div className="login-logo mb-4">
                <Logo width={787} height={225} style={{ width: "100%", maxWidth: 360, height: "auto" }} />
              </div>
              <LoginForm />
            </div>
          </div>

          {/* ── Right panel: brand ── */}
          <div className="login-split-brand d-none d-lg-flex">
            <div className="login-brand-overlay">
              <div className="login-brand-content">

                {/* Logo */}
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

                {/* Tagline */}
                <h2 className="login-brand-headline">
                  Smart. Scalable.<br />Built for Modern Wholesale.
                </h2>

                {/* Feature bullets */}
                <ul className="login-brand-features mt-4 mb-5">
                  <li>Real-time inventory across all outlets</li>
                  <li>Full AP / AR management</li>
                  <li>Sales orders, invoices &amp; purchase orders</li>
                  <li>Gold rate integration &amp; dynamic pricing</li>
                  <li>SMS &amp; Email notifications built-in</li>
                  <li>AI-powered chatbot for instant support</li>
                </ul>

                {/* Contact strip */}
                <div className="login-brand-contact">
                  <p className="login-brand-contact-label">Need help? Contact support</p>
                  <div className="login-brand-contact-items">
                    <a href="sms:+18153935767" className="login-brand-contact-item">
                      <MessageSquare size={14} />
                      <span>SMS: +181-JEWELPOS</span>
                    </a>
                    <a href="mailto:support@jewelpos.com" className="login-brand-contact-item">
                      <Mail size={14} />
                      <span>support@jewelpos.com</span>
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

export default LoginPage;
