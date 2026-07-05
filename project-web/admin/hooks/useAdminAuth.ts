import { useState, useCallback, useEffect } from "react";
import { api, ApiError } from "../../utils/client";

interface AdminUser {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  permissions: string[];
  verified: boolean;
  blocked: boolean;
  photo?: string;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminAuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  requiresTotp: boolean;
  totpChallengeToken: string | null;
  needs2faSetup: boolean;
  setupData: { otpauthUrl: string; secret: string } | null;
  setupLoading: boolean;
}

export const useAdminAuth = () => {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    requiresTotp: false,
    totpChallengeToken: null,
    needs2faSetup: false,
    setupData: null,
    setupLoading: false,
  });

  // Check auth status on mount via cookie
  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const data = await api.get<{ user: AdminUser }>("/auth/me");
      const user = data.user;

      // Check if user has any admin permission
      if (
        user.permissions &&
        user.permissions.some((p) => p.startsWith("admin")) &&
        !user.blocked
      ) {
        if (!user.twoFactorEnabled) {
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: false,
            requiresTotp: false,
            totpChallengeToken: null,
            needs2faSetup: true,
            setupData: null,
            setupLoading: false,
          });
        } else {
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: true,
            requiresTotp: false,
            totpChallengeToken: null,
            needs2faSetup: false,
            setupData: null,
            setupLoading: false,
          });
        }
      } else {
        logout();
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "You don't have admin permissions",
        }));
      }
    } catch {
      logout();
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to validate authentication",
      }));
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const data = await api.post<
        { user: AdminUser } | { requiresTotp: true; challengeToken: string }
      >("/auth/login", { identifier, password });

      // Handle TOTP challenge
      if ("requiresTotp" in data) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
          requiresTotp: true,
          totpChallengeToken: data.challengeToken,
        }));
        return;
      }

      const { user } = data;

      // Check if user has any admin permission
      if (
        user.permissions &&
        user.permissions.some((p) => p.startsWith("admin.")) &&
        !user.blocked
      ) {
        if (!user.twoFactorEnabled) {
          // Admin without 2FA — force setup
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: false,
            requiresTotp: false,
            totpChallengeToken: null,
            needs2faSetup: true,
            setupData: null,
            setupLoading: false,
          });
        } else {
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: true,
            requiresTotp: false,
            totpChallengeToken: null,
            needs2faSetup: false,
            setupData: null,
            setupLoading: false,
          });
        }
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "You don't have admin permissions",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof ApiError && error.status === 401
            ? "Invalid email/phone or password"
            : error instanceof ApiError && error.status === 403
              ? "Your account has been blocked"
              : "Login failed. Please try again.",
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    }
    setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      requiresTotp: false,
      totpChallengeToken: null,
      needs2faSetup: false,
      setupData: null,
      setupLoading: false,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const verifyTotp = useCallback(async (code: string) => {
    if (!state.totpChallengeToken) return;
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await api.post<{ user: AdminUser }>(
        "/auth/login/verify-totp",
        { challengeToken: state.totpChallengeToken, code },
      );
      const { user } = data;
      if (
        user.permissions &&
        user.permissions.some((p) => p.startsWith("admin.")) &&
        !user.blocked
      ) {
        if (!user.twoFactorEnabled) {
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: false,
            requiresTotp: false,
            totpChallengeToken: null,
            needs2faSetup: true,
            setupData: null,
            setupLoading: false,
          });
        } else {
          setState({
            user,
            loading: false,
            error: null,
            isAuthenticated: true,
            requiresTotp: false,
            totpChallengeToken: null,
            needs2faSetup: false,
            setupData: null,
            setupLoading: false,
          });
        }
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "You don't have admin permissions",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof ApiError && error.status === 401
            ? "Invalid TOTP code"
            : "TOTP verification failed. Please try again.",
      }));
    }
  }, [state.totpChallengeToken]);

  const cancelTotp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      requiresTotp: false,
      totpChallengeToken: null,
      error: null,
    }));
  }, []);

  const setup2fa = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, setupLoading: true, error: null }));
      const data = await api.post<{ otpauthUrl: string; secret: string }>(
        "/users/me/2fa/setup",
      );
      setState((prev) => ({
        ...prev,
        setupLoading: false,
        setupData: data,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        setupLoading: false,
        error: "Failed to start 2FA setup. Please try again.",
      }));
    }
  }, []);

  const confirm2fa = useCallback(async (code: string) => {
    try {
      setState((prev) => ({ ...prev, setupLoading: true, error: null }));
      await api.post("/users/me/2fa/verify", { code });
      setState((prev) => ({
        ...prev,
        setupLoading: false,
        needs2faSetup: false,
        isAuthenticated: true,
        setupData: null,
        user: prev.user ? { ...prev.user, twoFactorEnabled: true } : prev.user,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        setupLoading: false,
        error:
          error instanceof ApiError && error.status === 400
            ? "Invalid code. Please try again."
            : "2FA verification failed. Please try again.",
      }));
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    clearError,
    validateSession,
    verifyTotp,
    cancelTotp,
    setup2fa,
    confirm2fa,
  };
};
