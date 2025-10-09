import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminVerificationResult {
  isAdmin: boolean;
  roles: string[];
  loading: boolean;
  error: string | null;
}

export const useAdminVerification = (): AdminVerificationResult => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!session) {
        setIsAdmin(false);
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: funcError } = await supabase.functions.invoke('verify-admin', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (funcError) {
          console.error('Admin verification error:', funcError);
          setError(funcError.message);
          setIsAdmin(false);
          setRoles([]);
        } else {
          setIsAdmin(data.isAdmin || false);
          setRoles(data.roles || []);
          setError(null);
        }
      } catch (err) {
        console.error('Admin verification exception:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsAdmin(false);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [session]);

  return { isAdmin, roles, loading, error };
};
