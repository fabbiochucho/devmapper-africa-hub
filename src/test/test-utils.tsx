import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserRoleProvider } from "@/contexts/UserRoleContext";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <BrowserRouter>{children}</BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Nests AuthProvider -> UserRoleProvider on top of AllProviders. Three
// existing tests each hand-rolled this wrapper themselves before it was
// consolidated here - use this (or renderWithAuth below) for any new test
// that needs auth/role context.
function AllProvidersWithAuth({ children }: { children: React.ReactNode }) {
  return (
    <AllProviders>
      <AuthProvider>
        <UserRoleProvider>{children}</UserRoleProvider>
      </AuthProvider>
    </AllProviders>
  );
}

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllProviders, ...options });

const renderWithAuth = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllProvidersWithAuth, ...options });

export * from "@testing-library/react";
export { customRender as render, renderWithAuth };
