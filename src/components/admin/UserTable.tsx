
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MockUser } from "@/data/mockUsers";
import { Check, UserX } from "lucide-react";

interface UserTableProps {
  users: MockUser[];
  onUpdateUser: (userId: number, verified: boolean) => void;
}

const UserTable = ({ users, onUpdateUser }: UserTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <Badge variant={user.verified ? "default" : "destructive"}>
                {user.verified ? "Verified" : "Not Verified"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {!user.verified && (
                <div className="flex space-x-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => onUpdateUser(user.id, true)}>
                    <Check className="w-4 h-4 mr-1" /> Verify
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
