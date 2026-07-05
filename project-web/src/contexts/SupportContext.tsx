import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ScreenshotEvent } from "@rdlabo/capacitor-screenshot-event";
import { Screenshot } from "capacitor-screenshot";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "../../node_modules/react-i18next";

interface SupportContextType {
  showSupportSheet: boolean;
  setShowSupportSheet: (show: boolean) => void;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  supportPhoto: string | null;
  setSupportPhoto: (photo: string | null) => void;
  supportCategory: string;
  setSupportCategory: (category: string) => void;
  sendingSupport: boolean;
  sendSupportRequest: () => Promise<void>;
  openSupportWithScreenshot: () => void;
  isAutoCapturedScreenshot: boolean;
  captureScreenshot: () => Promise<string | null>;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

interface SupportProviderProps {
  children: ReactNode;
}

export function SupportProvider({ children }: SupportProviderProps) {
  const { t } = useTranslation();
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportPhoto, setSupportPhoto] = useState<string | null>(null);
  const [supportCategory, setSupportCategory] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);
  const [isAutoCapturedScreenshot, setIsAutoCapturedScreenshot] =
    useState(false);

  // Initialize screenshot detection
  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    const initializeScreenshotDetection = async () => {
      try {
        // Add listener for screenshot events
        listenerHandle = await ScreenshotEvent.addListener(
          "userDidTakeScreenshot",
          async () => {
            console.log("Screenshot detected!");
            // Capture screenshot and open support sheet
            await openSupportWithCapturedScreenshot();
          },
        );

        // Start watching for screenshot events
        await ScreenshotEvent.startWatchEvent();
        console.log("Screenshot detection started");
      } catch (error) {
        console.error("Failed to initialize screenshot detection:", error);
      }
    };

    initializeScreenshotDetection();

    // Cleanup on unmount
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
      ScreenshotEvent.removeWatchEvent();
    };
  }, []);

  const sendSupportRequest = async () => {
    if (!supportCategory) {
      toast({
        title: t("profile_category_required"),
        description: t("profile_please_select_category"),
      });
      return;
    }

    setSendingSupport(true);
    try {
      // Simulate sending support request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: t("profile_support_request_sent"),
        description: t("profile_support_response_time"),
      });

      // Reset form
      setSupportMessage("");
      setSupportPhoto(null);
      setSupportCategory("");
      setIsAutoCapturedScreenshot(false);
      setShowSupportSheet(false);
    } catch (error) {
      console.error("Support request failed:", error);
      toast({
        title: t("profile_support_request_failed"),
        description: t("profile_try_again_later"),
      });
    } finally {
      setSendingSupport(false);
    }
  };

  const captureScreenshot = async (): Promise<string | null> => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Screenshot capture timeout")), 5000);
      });

      const screenshotPromise = Screenshot.take();

      const result = await Promise.race([screenshotPromise, timeoutPromise]);

      if (result && result.base64) {
        // Convert to data URL format for PhotoUploader compatibility
        return `data:image/png;base64,${result.base64}`;
      }
      return null;
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      return null;
    }
  };

  const openSupportWithCapturedScreenshot = async () => {
    try {
      // Capture screenshot
      const capturedImage = await captureScreenshot();

      // Reset form and set captured screenshot
      setSupportMessage("");
      setSupportPhoto(capturedImage);
      setSupportCategory("");
      setIsAutoCapturedScreenshot(!!capturedImage);
      setShowSupportSheet(true);

      // Show appropriate toast based on capture success
      if (capturedImage) {
        toast({
          title: "Screenshot Captured",
          description: "Support form opened with screenshot attached",
        });
      } else {
        toast({
          title: "Screenshot Detected",
          description:
            "Support form opened - you can attach the screenshot manually",
        });
      }
    } catch (error) {
      console.error("Failed to open support with captured screenshot:", error);
      // Fallback to regular support sheet
      openSupportWithScreenshot();
    }
  };

  const openSupportWithScreenshot = () => {
    // Reset form and open support sheet
    setSupportMessage("");
    setSupportPhoto(null);
    setSupportCategory("");
    setShowSupportSheet(true);

    // Optionally show a toast to indicate screenshot was detected
    toast({
      title: "Screenshot Detected",
      description:
        "Support form opened - you can attach the screenshot if needed",
    });
  };

  const value: SupportContextType = {
    showSupportSheet,
    setShowSupportSheet,
    supportMessage,
    setSupportMessage,
    supportPhoto,
    setSupportPhoto,
    supportCategory,
    setSupportCategory,
    sendingSupport,
    sendSupportRequest,
    openSupportWithScreenshot,
    isAutoCapturedScreenshot,
    captureScreenshot,
  };

  return (
    <SupportContext.Provider value={value}>{children}</SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error("useSupport must be used within a SupportProvider");
  }
  return context;
}
