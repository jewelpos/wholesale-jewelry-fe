import ApolloClientProvider from "./ApolloClientProvider";

export default function AuthorizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ApolloClientProvider>{children}</ApolloClientProvider>;
}
