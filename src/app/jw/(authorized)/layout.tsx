import { ErrorBoundary } from "@/components/root/ErrorBoundary";
import ApolloClientProviderAuthorized from "./ApolloClientProviderAuthorized";
import UserData from "@/components/root/UserData";
import { Suspense } from "react";
import FullPageLoader from "@/components/ui/FullPageLoader";

export default function AuthorizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`main-wrapper `}>
      <ApolloClientProviderAuthorized>
        {/* <ErrorBoundary
          fallback={
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              Something went wrong while loading posts.
            </div>
          }
        > */}
        <UserData>{children}</UserData>
        {/* </ErrorBoundary> */}
      </ApolloClientProviderAuthorized>
    </div>
  );
}
