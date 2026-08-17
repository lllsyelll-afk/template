import { memo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/auth";
import { LoadingView } from "./LoadingView";

interface Props {
  children: React.ReactNode;
}
function RequireGuest({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();

  useEffect(() => {
    if (isAuthenticated) {
      // Check for redirect param using useSearch hook
      const params = new URLSearchParams(search || "");
      const redirectTo = params.get("redirect");
      // Redirect to specified URL or default to /
      navigate(redirectTo || "/");
    }
  }, [isAuthenticated, search, navigate]);

  if (isLoading && !isAuthenticated) return <LoadingView />;
  if (isAuthenticated) return <LoadingView />;
  return <>{children}</>;
}

export default memo(RequireGuest);
