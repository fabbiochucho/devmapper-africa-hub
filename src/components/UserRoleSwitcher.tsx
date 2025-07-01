
import React from "react";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddRoleDialog } from "./AddRoleDialog";

const UserRoleSwitcher = () => {
  const { roles, currentRole, setCurrentRole, hasRole, removeRole } = useUserRole();
  const [showAddRole, setShowAddRole] = React.useState(false);

  const handleRoleChange = (value: UserRole) => {
    if (hasRole(value)) {
      setCurrentRole(value);
    }
  };

  const handleRemoveRole = async (role: UserRole) => {
    if (roles.length > 1) {
      await removeRole(role);
    }
  };

  return (
    <div className="p-4 space-y-4 border-t bg-card">
      <div className="space-y-2">
        <Label htmlFor="role-switcher" className="text-xs font-medium text-muted-foreground">
          Current Role
        </Label>
        <Select value={currentRole} onValueChange={handleRoleChange}>
          <SelectTrigger id="role-switcher" className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((roleData) => (
              <SelectItem key={roleData.role} value={roleData.role}>
                {roleData.role}
                {roleData.organization && ` (${roleData.organization})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Your Roles
          </Label>
          <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
              </DialogHeader>
              <AddRoleDialog onClose={() => setShowAddRole(false)} />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {roles.map((roleData) => (
            <Badge
              key={roleData.role}
              variant={roleData.role === currentRole ? "default" : "secondary"}
              className="text-xs flex items-center gap-1"
            >
              {roleData.role}
              {roles.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveRole(roleData.role)}
                >
                  <X className="h-2 w-2" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserRoleSwitcher;
