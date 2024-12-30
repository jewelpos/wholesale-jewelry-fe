"use client";

import { ApolloProvider } from "@apollo/client";
import client from "@/lib/appolloClient";

export default function AppolloClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
