import { ErrorBoundary } from "@/components/root/ErrorBoundary";
import ApolloClientProviderAuthorized from "./ApolloClientProviderAuthorized";
import InitialDataLoader from "@/components/root/InitialDataLoader";
import { PermissionGuard } from "@/components/root/PermissionGuard";
import SessionExpiredModal from "@/components/root/SessionExpiredModal";
import { NavigationGuardProvider } from "@/lib/context/NavigationGuardContext";

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
          <NavigationGuardProvider>
            <InitialDataLoader>
              <PermissionGuard>{children}</PermissionGuard>
            </InitialDataLoader>
          </NavigationGuardProvider>
        </ErrorBoundary>
        <SessionExpiredModal />
      </ApolloClientProviderAuthorized>
    </div>
  );
}
