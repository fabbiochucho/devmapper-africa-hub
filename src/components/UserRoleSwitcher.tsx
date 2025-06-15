
import { useUserRole, ALL_ROLES, UserRole } from "@/contexts/UserRoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const UserRoleSwitcher = () => {
  const { role, setRole } = useUserRole();

  return (
    <div className="p-2 space-y-2 border-t">
      <Label htmlFor="role-switcher" className="text-xs font-medium text-muted-foreground px-2">
        Simulate User Role
      </Label>
      <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
        <SelectTrigger id="role-switcher" className="w-full">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {ALL_ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserRoleSwitcher;
