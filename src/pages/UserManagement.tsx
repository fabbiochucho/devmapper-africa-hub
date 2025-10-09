import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import UserTable from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { useAdminVerification } from "@/hooks/useAdminVerification";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  organization: string | null;
  country: string | null;
  is_verified: boolean;
  created_at: string;
}

const UserManagement = () => {
  const { isAdmin, loading: adminLoading } = useAdminVerification();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: "block" | "verify" | "delete") => {
    try {
      if (action === "verify") {
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', userId);

        if (error) throw error;
        await loadUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={loadUsers}>Refresh</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={users} onUserAction={handleUserAction} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
