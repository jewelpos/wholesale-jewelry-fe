"use client";

import { apolloClientAuthorized } from "@/lib/apolloClientAuthorized";
import { ApolloProvider } from "@apollo/client";

export default function ApolloClientProviderAuthorized({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApolloProvider client={apolloClientAuthorized}>{children}</ApolloProvider>
  );
}
