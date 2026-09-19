import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userRoles: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string, role?: string) => Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithGithub: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | PostgrestError | null }>;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isProfileEqual(a: UserProfile | null, b: UserProfile | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function areRolesEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((role, i) => role === sortedB[i]);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoized fetch to prevent duplicate calls
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Batch all queries in parallel for performance
      const [profileResult, rolesResult, orgResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId).eq('is_active', true),
        supabase.from('organizations').select('id').eq('created_by', userId).limit(1).maybeSingle()
      ]);

      const nextProfile = profileResult.data as UserProfile | null;
      const nextRoles = rolesResult.data?.map(r => r.role) || [];

      // Keep the same object/array reference when the fetched data hasn't
      // actually changed (e.g. a background TOKEN_REFRESHED reconciliation)
      // so consumers that hydrate local form state from `profile` via a
      // `[profile]` effect dependency don't get retriggered and clobber
      // whatever the user is mid-typing.
      setProfile((prev) => (isProfileEqual(prev, nextProfile) ? prev : nextProfile));
      setUserRoles((prev) => (areRolesEqual(prev, nextRoles) ? prev : nextRoles));

      // Auto-create organization if none exists (needed for quotas/billing)
      if (!orgResult.data && profileResult.data) {
        const name = profileResult.data?.full_name
          ? `${profileResult.data.full_name}'s Organization`
          : 'My Organization';
        // Fire and forget - don't block UI
        supabase.from('organizations').insert([{ name, created_by: userId }]).then(() => {});
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // `loading` must only clear once fetchProfile has actually resolved -
    // RoleRoute/consumers treat loading=false as "profile/roles are final",
    // so clearing it before the fetch settles bounces authorized users off
    // role-gated routes (the same bug already fixed in UserRoleContext.tsx).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          setProfile(null);
          setUserRoles([]);
          setLoading(false);
          return;
        }

        // Refetch on every event, including background TOKEN_REFRESHED
        // rotations, so a server-side role/profile change (e.g. an admin
        // revoking a privilege) reconciles promptly instead of only on the
        // next full sign-in. fetchProfile itself avoids identity churn when
        // the data hasn't changed (see isProfileEqual/areRolesEqual above),
        // so this no longer clobbers in-progress form edits.
        //
        // Still deferred via setTimeout to avoid calling further Supabase
        // methods synchronously inside onAuthStateChange (documented
        // deadlock risk), but loading now waits for the deferred fetch.
        setTimeout(() => {
          if (!mounted) return;
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        }, 0);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string, role?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const metadata: Record<string, string> = {};
    if (fullName) metadata.full_name = fullName;
    if (role) metadata.selected_role = role;
    const { error, data } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: redirectUrl,
        data: Object.keys(metadata).length ? metadata : undefined
      }
    });
    if (error) toast.error(error.message);
    else toast.success('Check your email to confirm your account!');
    return { error, data };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success('Signed in successfully!');
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success('Signed out successfully!');
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) toast.error(error.message);
    return { error };
  }, []);

  const signInWithGithub = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) toast.error(error.message);
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`
    });
    if (error) toast.error(error.message);
    else toast.success('Password reset email sent! Check your inbox.');
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else toast.success('Password updated successfully!');
    return { error };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase.from('profiles').update(updates).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Profile updated successfully!');
      fetchProfile(user.id);
    }
    return { error };
  }, [user, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const hasRole = useCallback((role: string) => userRoles.includes(role), [userRoles]);
  
  const isAdmin = useMemo(() => 
    userRoles.includes('admin') || userRoles.includes('platform_admin'), 
    [userRoles]
  );

  const value = useMemo<AuthContextType>(() => ({
    user, session, profile, userRoles, loading,
    signIn, signUp, signOut, signInWithGoogle, signInWithGithub,
    resetPassword, updatePassword, updateProfile, hasRole, isAdmin, refreshProfile
  }), [
    user, session, profile, userRoles, loading,
    signIn, signUp, signOut, signInWithGoogle, signInWithGithub,
    resetPassword, updatePassword, updateProfile, hasRole, isAdmin, refreshProfile
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth is imported alongside AuthProvider from this file in ~80 places;
// splitting it into its own module is a large mechanical rename with no
// behavior benefit (HMR fast-refresh only), so scope the warning down instead.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
