import { useUserRole } from "@/contexts/UserRoleContext";
import { Navigate } from "react-router-dom";

interface RoleRouteProps {
  roles: string[];
  children: React.ReactNode;
}

const RoleRoute = ({ roles, children }: RoleRouteProps) => {
  const { currentRole } = useUserRole();
  if (!roles.includes(currentRole)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RoleRoute;
