import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProvider from "../../features/auth/AuthProvider";
import ConfirmToastProvider from "../../components/feedback/ConfirmToastProvider";

export default function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 0,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ConfirmToastProvider>{children}</ConfirmToastProvider></AuthProvider>
    </QueryClientProvider>
  );
}
