import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/scss/main.scss";
import "../styles/icons/fontawesome/css/fontawesome.min.css";
import "../styles/icons/fontawesome/css/all.min.css";
import "../styles/css/feather.css";
import BootstrapJS from "@/components/root/BootstrapJS";
import StoreProvider from "./StoreProvider";

export const metadata: Metadata = {
  title: "POS",
  description: "POS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <BootstrapJS />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
