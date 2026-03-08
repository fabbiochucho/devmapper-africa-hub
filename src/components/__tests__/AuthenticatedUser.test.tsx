import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import React from 'react';

const mockUser = {
  id: 'test-user-id',
  email: 'test@devmapper.africa',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Test User' },
  created_at: '2024-01-01',
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_at: Date.now() / 1000 + 3600,
  expires_in: 3600,
  token_type: 'bearer',
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
      onAuthStateChange: vi.fn((cb: any) => {
        // Fire the callback with the mock session
        setTimeout(() => cb('SIGNED_IN', mockSession), 0);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            data: [],
          }),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'profile-1',
              user_id: 'test-user-id',
              email: 'test@devmapper.africa',
              full_name: 'Test User',
              is_verified: true,
              country: 'KE',
              organization: 'Test Org',
              avatar_url: null,
              bio: null,
              phone: null,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
            error: null,
          }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UserRoleProvider } from '@/contexts/UserRoleContext';

function TestWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <BrowserRouter>
          <AuthProvider>
            <UserRoleProvider>{children}</UserRoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthStatus() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div>{user ? `Signed in as ${user.email}` : 'Not signed in'}</div>;
}

describe('Authenticated user flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows authenticated user email from mocked session', async () => {
    render(<AuthStatus />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText(/Signed in as test@devmapper.africa/)).toBeInTheDocument();
    });
  });

  it('exposes user object when session exists', async () => {
    let capturedUser: any = null;
    function Capture() {
      const { user, loading } = useAuth();
      if (!loading) capturedUser = user;
      return <div>{loading ? 'loading' : 'done'}</div>;
    }
    render(<Capture />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(capturedUser).not.toBeNull();
      expect(capturedUser?.id).toBe('test-user-id');
    });
  });
});
