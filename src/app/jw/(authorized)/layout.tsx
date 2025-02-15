import { ErrorBoundary } from "@/components/root/ErrorBoundary";
import ApolloClientProviderAuthorized from "./ApolloClientProviderAuthorized";
import InitialDataLoader from "@/components/root/InitialDataLoader";
import { PermissionGuard } from "@/components/root/PermissionGuard";

export default function AuthorizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`main-wrapper `}>
      <ApolloClientProviderAuthorized>
        <ErrorBoundary
          fallback={
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              Something went wrong while loading posts.
            </div>
          }
        >
          <InitialDataLoader>
            <PermissionGuard>{children}</PermissionGuard>
          </InitialDataLoader>
        </ErrorBoundary>
      </ApolloClientProviderAuthorized>
    </div>
  );
}
