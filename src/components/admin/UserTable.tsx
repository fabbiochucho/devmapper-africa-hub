import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, XCircle, Ban, Pencil } from "lucide-react";

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

interface UserTableProps {
  users: UserProfile[];
  onUserAction: (userId: string, action: "block" | "verify" | "delete" | "edit") => void;
}

const UserTable = ({ users, onUserAction }: UserTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No users found
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || "—"}</TableCell>
              <TableCell>{user.email || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline">{user.country || "N/A"}</Badge>
              </TableCell>
              <TableCell>{user.organization || "—"}</TableCell>
              <TableCell>
                <Badge variant={user.is_verified ? "default" : "destructive"}>
                  {user.is_verified ? "Verified" : "Unverified"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUserAction(user.id, "edit")}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUserAction(user.id, "verify")}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {user.is_verified ? "Review Verification" : "Verify"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUserAction(user.id, "block")}>
                      <Ban className="w-4 h-4 mr-2" />
                      Block
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUserAction(user.id, "delete")}
                      className="text-destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default UserTable;
