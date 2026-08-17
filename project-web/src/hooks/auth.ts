import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@utils/client";
import type { User } from "app-types";

export interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "error";
  error: string | null;
}

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

// Local state management for auth (cookie-based, no in-memory token)
let authState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

const listeners = new Set<(state: AuthState) => void>();

function updateState(updates: Partial<AuthState>) {
  authState = { ...authState, ...updates };
  listeners.forEach((listener) => listener(authState));
}

function subscribe(listener: (state: AuthState) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Query hooks
export function useAuth() {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    return subscribe(setState);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        return await api.get<{ user: User }>("/auth/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null; // Not authenticated — normal, not an error
        }
        // Network errors should not clear auth state or trigger error toasts
        if (
          err instanceof Error &&
          (err.message.toLowerCase().includes("fetch") ||
            err.message.toLowerCase().includes("network") ||
            err.message.toLowerCase().includes("load failed") ||
            err.message.toLowerCase().includes("failed to connect"))
        ) {
          console.warn("[auth] network error, keeping existing state:", err.message);
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 30 * 1000, // 30 seconds for auth data
  });

  // Handle success and error effects separately
  useEffect(() => {
    if (data) {
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      updateState({
        user: null,
        status: "error",
        error: error instanceof Error ? error.message : "me_failed",
      });
    }
  }, [error]);

  return {
    ...state,
    isLoading: isLoading || state.status === "loading",
    isAuthenticated: !!state.user,
  };
}

// Mutation hooks
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { identifier: string; password: string }) => {
      const result = await api.post<{ user: User } | { requiresTotp: true; challengeToken: string }>(
        "/auth/login",
        input,
      );
      return result;
    },
    onSuccess: (data) => {
      if ("requiresTotp" in data) {
        updateState({ status: "idle", error: null });
        return;
      }
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      updateState({
        status: "error",
        error: error instanceof Error ? error.message : "login_failed",
      });
    },
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credential: string) => {
      updateState({ status: "loading", error: null });
      const result = await api.post<{ user: User } | { requiresTotp: true; challengeToken: string }>(
        "/auth/google-login",
        { credential },
      );
      return result;
    },
    onSuccess: (data) => {
      if ("requiresTotp" in data) {
        updateState({ status: "idle", error: null });
        return;
      }
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      updateState({
        status: "error",
        error: error instanceof Error ? error.message : "google_login_failed",
      });
    },
  });
}

export function useGoogleRegisterInfo() {
  return useMutation({
    mutationFn: async (credential: string) => {
      const result = await api.post<{
        googleId: string;
        email: string;
        name?: string;
        picture?: string;
      }>("/auth/google-register-info", { credential });
      return result;
    },
  });
}

export function useFacebookLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accessToken: string) => {
      updateState({ status: "loading", error: null });
      const result = await api.post<{ user: User } | { requiresTotp: true; challengeToken: string }>(
        "/auth/facebook-login",
        { accessToken },
      );
      return result;
    },
    onSuccess: (data) => {
      if ("requiresTotp" in data) {
        updateState({ status: "idle", error: null });
        return;
      }
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      updateState({
        status: "error",
        error: error instanceof Error ? error.message : "facebook_login_failed",
      });
    },
  });
}

export function useFacebookRegisterInfo() {
  return useMutation({
    mutationFn: async (accessToken: string) => {
      const result = await api.post<{
        facebookId: string;
        email?: string;
        name?: string;
        picture?: string;
      }>("/auth/facebook-register-info", { accessToken });
      return result;
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      phone: string;
      email?: string;
      password: string;
      photo?: string;
      googleId?: string;
      facebookId?: string;
    }) => {
      // NOTE: Do NOT flip the global auth status to "loading" here.
      // Registration does not authenticate the user (OTP is still pending),
      // and the global loading state causes RequireGuest to unmount the
      // AuthPage, resetting the multi-step form back to the first step.
      const result = await api.post<{
        user: User;
        otp?: { code?: string; identifier: string };
      }>("/auth/register", input);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      updateState({
        status: "error",
        error: error instanceof Error ? error.message : "register_failed",
      });
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      identifier: string;
      code: string;
      purpose?: "register" | "login";
    }) => {
      updateState({ status: "loading", error: null });
      const result = await api.post<{ user: User }>(
        "/auth/verify-otp",
        input,
      );
      return result;
    },
    onSuccess: (data) => {
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      updateState({
        status: "error",
        error: error instanceof Error ? error.message : "otp_failed",
      });
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: async () => {
      const result = await api.post<{
        otp?: { code?: string; identifier: string };
      }>("/auth/resend-otp");
      return result;
    },
    onError: (error) => {
      console.error("Resend OTP failed:", error);
    },
  });
}

export function useRequestForgotPasswordOtp() {
  return useMutation({
    mutationFn: async (input: { phone: string }) => {
      const result = await api.post<{
        message: string;
        otp?: { code?: string; identifier: string };
      }>("/auth/forgot-password-request", input);
      return result;
    },
    onError: (error) => {
      console.error("Forgot password OTP request failed:", error);
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      identifier: string;
      code: string;
      newPassword?: string;
    }) => {
      const result = await api.post<{ user: User }>(
        "/auth/reset-password",
        input,
      );
      return result;
    },
    onSuccess: (data) => {
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      updateState({
        status: "error",
        error: error instanceof Error ? error.message : "reset_password_failed",
      });
    },
  });
}

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const result = await api.post<{
        message: string;
        email: string;
        otp?: { code?: string; identifier: string };
      }>("/users/me/email-change-request", input);
      return result;
    },
    onError: (error) => {
      console.error("Email change request failed:", error);
    },
  });
}

export function useVerifyEmailChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; code: string }) => {
      const result = await api.post<{
        message: string;
        user: User;
      }>("/users/me/email-change-verify", input);
      return result;
    },
    onSuccess: (data) => {
      // Update user state with new email
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error("Email change verification failed:", error);
    },
  });
}




export function useRequestPhoneChange() {
  return useMutation({
    mutationFn: async (input: { phone: string }) => {
      const result = await api.post<{
        message: string;
        phone: string;
        otp?: { code?: string; identifier: string };
      }>("/users/me/phone-change-request", input);
      return result;
    },
    onError: (error) => {
      console.error("Phone change request failed:", error);
    },
  });
}

export function useVerifyPhoneChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { phone: string; code: string }) => {
      const result = await api.post<{
        message: string;
        user: User;
      }>("/users/me/phone-change-verify", input);
      return result;
    },
    onSuccess: (data) => {
      // Update user state with new phone
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error("Phone change verification failed:", error);
    },
  });
}




// Action hooks
export function useLogoutOthers() {
  return useMutation({
    mutationFn: async () => {
      const result = await api.post<{ user: User }>(
        "/auth/logout-others",
      );
      return result;
    },
    onSuccess: (data) => {
      updateState({ user: data.user, status: "idle" });
    },
    onError: (error) => {
      console.error("Logout others failed:", error);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    }
    updateState({
      user: null,
      status: "idle",
      error: null,
    });
    queryClient.clear();
  };
}



// ── 2FA (TOTP) hooks ──

export function useLoginVerifyTotp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { challengeToken: string; code: string }) => {
      updateState({ status: "loading", error: null });
      const result = await api.post<{ user: User }>(
        "/auth/login/verify-totp",
        input,
      );
      return result;
    },
    onSuccess: (data) => {
      updateState({
        user: data.user,
        status: "idle",
        error: null,
      });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      updateState({
        status: "error",
        error: error instanceof Error ? error.message : "totp_failed",
      });
    },
  });
}

export function useSetup2fa() {
  return useMutation({
    mutationFn: async () => {
      const result = await api.post<{ otpauthUrl: string; secret: string }>(
        "/users/me/2fa/setup",
      );
      return result;
    },
  });
}

export function useVerify2fa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { code: string }) => {
      const result = await api.post<{ enabled: boolean }>(
        "/users/me/2fa/verify",
        input,
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useDisable2fa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { code: string }) => {
      const result = await api.post<{ enabled: boolean }>(
        "/users/me/2fa/disable",
        input,
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}
