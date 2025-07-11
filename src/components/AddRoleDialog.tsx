import React, { useState } from "react";
import { useUserRole, UserRole, ALL_ROLES } from "@/contexts/UserRoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AddRoleDialogProps {
  onClose: () => void;
}

export const AddRoleDialog = ({ onClose }: AddRoleDialogProps) => {
  const { addRole, hasRole } = useUserRole();
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [organization, setOrganization] = useState("");
  const [country, setCountry] = useState("");

  const availableRoles = ALL_ROLES.filter(role => !hasRole(role));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    try {
      await addRole({
        role: selectedRole as UserRole,
        organization: organization || undefined,
        country: country || undefined,
        is_active: true
      });
      
      const roleDisplayName = getRoleDisplayName(selectedRole as UserRole);
      toast.success(`${roleDisplayName} role added successfully`);
      onClose();
    } catch (error) {
      toast.error("Failed to add role");
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      'citizen_reporter': 'Citizen Reporter',
      'ngo_member': 'NGO Member',
      'government_official': 'Government Official',
      'company_representative': 'Company Representative',
      'country_admin': 'Country Admin',
      'platform_admin': 'Platform Admin',
      'change_maker': 'Change Maker',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  if (availableRoles.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">You already have all available roles.</p>
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role to add" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {getRoleDisplayName(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRole && (selectedRole === "ngo_member" || selectedRole === "government_official" || selectedRole === "company_representative") && (
        <div>
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Enter organization name"
          />
        </div>
      )}

      <div>
        <Label htmlFor="country">Country (Optional)</Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Enter country"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Add Role
        </Button>
      </div>
    </form>
  );
};