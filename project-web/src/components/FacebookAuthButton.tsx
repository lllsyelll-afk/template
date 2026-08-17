import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";

declare global {
  interface Window {
    FB?: {
      init: (options: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string; userID: string } }) => void,
        options?: { scope: string },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface FacebookAuthButtonProps {
  mode?: "login" | "register";
  onSuccess: (accessToken: string) => void;
  onError: (error?: unknown) => void;
  disabled?: boolean;
}

export function FacebookAuthButton({
  onSuccess,
  onError,
  disabled,
}: FacebookAuthButtonProps) {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!appId) return;

    if (window.FB) {
      setIsSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: appId,
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
      setIsSdkReady(true);
    };

    const existingScript = document.getElementById("facebook-jssdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [appId]);

  if (!appId) return null;

  const handleLogin = () => {
    if (!window.FB) {
      onError(new Error("Facebook SDK not loaded"));
      return;
    }

    setIsLoading(true);
    try {
      window.FB.login(
        (response) => {
          setIsLoading(false);
          if (response.authResponse?.accessToken) {
            onSuccess(response.authResponse.accessToken);
          } else {
            onError(new Error("Facebook login cancelled or failed"));
          }
        },
        { scope: "public_profile,email" },
      );
    } catch (err) {
      setIsLoading(false);
      onError(err);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleLogin}
      disabled={disabled || !isSdkReady || isLoading}
      className="bg-[#1877F2] hover:bg-[#1877F2]/90 shadow-none p-0! border border-border rounded-full w-10! h-10! text-white hover:text-white transition-all duration-200"
      title="Continue with Facebook"
      aria-label="Continue with Facebook"
    >
      <svg className="fill-current w-5 h-5" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </Button>
  );
}
