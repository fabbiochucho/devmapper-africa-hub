import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

interface RoleRouteProps {
  roles: string[];
  children: React.ReactNode;
}

const RoleRoute = ({ roles, children }: RoleRouteProps) => {
  const { userRoles, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  const allowed = roles.some((r) => userRoles.includes(r));
  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RoleRoute;
