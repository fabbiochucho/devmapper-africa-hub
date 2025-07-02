
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockUsers } from "@/data/mockUsers";
import UserTable from "@/components/admin/UserTable";
import { useUserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";

const ADMIN_ROLES = ["Platform Admin", "Country Admin"];

const UserManagement = () => {
  const { currentRole } = useUserRole();
  const [users, setUsers] = useState(mockUsers);

  const handleUpdateUserVerification = (userId: number, verified: boolean) => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      mockUsers[userIndex].verified = verified;
      setUsers([...mockUsers]);
      toast.success(`User has been ${verified ? "verified" : "rejected"}.`);
    } else {
      toast.error("User not found.");
    }
  };

  if (!ADMIN_ROLES.includes(currentRole)) {
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
      <h1 className="text-2xl font-bold">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={users} onUpdateUser={handleUpdateUserVerification} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
