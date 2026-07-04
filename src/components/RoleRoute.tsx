import { Navigate } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { useUserRole, type UserRole } from "@/contexts/UserRoleContext";

interface RoleRouteProps {
  roles: string[];
  children: React.ReactNode;
}

const RoleRoute = ({ roles, children }: RoleRouteProps) => {
  const { currentRole, hasRole, isLoading } = useUserRole();

  if (isLoading) return <PageSkeleton />;

  const allowed =
    roles.includes(currentRole as string) ||
    roles.some((r) => hasRole(r as UserRole));

  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RoleRoute;
