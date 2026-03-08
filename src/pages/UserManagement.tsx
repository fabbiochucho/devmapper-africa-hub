import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import UserTable from "@/components/admin/UserTable";
import EditUserDialog from "@/components/admin/EditUserDialog";
import VerifyUserDialog from "@/components/admin/VerifyUserDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminVerification } from "@/hooks/useAdminVerification";
import { Loader2, Search, RefreshCw } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [verifyUser, setVerifyUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: "block" | "verify" | "delete" | "edit") => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (action === "edit") {
      setEditUser(user);
    } else if (action === "verify") {
      setVerifyUser(user);
    } else if (action === "block") {
      // Deactivate all roles for the user
      try {
        const { error } = await supabase
          .from("user_roles")
          .update({ is_active: false })
          .eq("user_id", user.user_id);
        if (error) throw error;
        await loadUsers();
      } catch (error) {
        console.error("Error blocking user:", error);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.organization?.toLowerCase().includes(term) ||
      u.country?.toLowerCase().includes(term)
    );
  });

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
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, organization, or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={filteredUsers} onUserAction={handleUserAction} />
        </CardContent>
      </Card>

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSaved={loadUsers}
      />

      <VerifyUserDialog
        user={verifyUser}
        open={!!verifyUser}
        onOpenChange={(open) => !open && setVerifyUser(null)}
        onVerified={loadUsers}
      />
    </div>
  );
};

export default UserManagement;
