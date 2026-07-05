import { useEffect, memo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/auth";
import { LoadingView } from "./LoadingView";

interface Props {
  children: React.ReactNode;
}
function RequireAuth({ children }: Props) {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  useEffect(() => {
    if (!isAuthenticated && !isLoading) navigate("/login");
  }, [isLoading, isAuthenticated, navigate]);
  if (isLoading && !isAuthenticated) return <LoadingView />;
  return <>{children}</>;
}

export default memo(RequireAuth);
