import { useEffect, useState } from "react";
import type React from "react";
import { useLocation } from "wouter";
import { useTranslation } from "../../node_modules/react-i18next";
import { Menu, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth";
import { wsService } from "@/services/websocket";
import { useLanguage } from "@components/LanguageContext";
import PageTransition from "./PageTransition";
import { useBackSwipe, useSidebarSwipe } from "@/hooks/useGestures";
import { Sidebar } from "./Sidebar";
interface AppShellProps {
  children: React.ReactNode;
  rightHeaderContent?: React.ReactNode;
  centerHeaderContent?: React.ReactNode;
}
function AppShellInner({
  children,
  rightHeaderContent,
  centerHeaderContent,
}: AppShellProps) {
  useTranslation();
  const [path] = useLocation();
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Gestures
  const swipeHandlers = useSidebarSwipe(
    mobileSidebarOpen,
    isRTL,
    () => setMobileSidebarOpen(true),
    () => setMobileSidebarOpen(false),
  );
  const backSwipe = useBackSwipe(true, () => window.history.back());

  // WebSocket connection lifecycle
  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }
    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <div
      className="flex h-dvh overflow-hidden"
      onTouchStart={swipeHandlers.handleTouchStart}
      onTouchMove={swipeHandlers.handleTouchMove}
      onTouchEnd={swipeHandlers.handleTouchEnd}
    >
      <Sidebar
        path={path}
        isRTL={isRTL}
        isMobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        sidebarRef={swipeHandlers.sidebarRef}
      />
      <div
        className={cn(
          "flex flex-col flex-1 overflow-hidden",
          isRTL ? "md:mr-[210px]" : "md:ml-[210px]",
        )}
      >
        {/* Top bar */}
        <div
          className={cn(
            "flex items-center gap-3 shadow-xl px-3 py-2 md:px-4 md:py-3 border-border border-b-2 h-16.25",
            isRTL ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div className="flex items-center">
            <button
              onClick={() => window.history.back()}
              className="flex justify-center items-center p-2 rounded-lg cursor-pointer shrink-0"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          {centerHeaderContent ? (
            <div className="flex flex-1 items-center mx-2">
              {centerHeaderContent}
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-1 items-center",
                isRTL ? "justify-end" : "justify-start",
              )}
            >
              <span className="font-semibold text-2xl">App</span>
            </div>
          )}
          {rightHeaderContent && (
            <div className="flex items-center gap-2 shrink-0">
              {rightHeaderContent}
            </div>
          )}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden flex justify-center items-center p-2 rounded-lg cursor-pointer shrink-0"
          >
            <Menu size={24} />
          </button>
        </div>
        <main
          className="relative flex-1 overflow-y-auto"
          onTouchStart={backSwipe.handleTouchStart}
          onTouchMove={backSwipe.handleTouchMove}
          onTouchEnd={backSwipe.handleTouchEnd}
        >
          {backSwipe.isSwiping && (
            <div
              className="fixed inset-0 z-100 bg-background"
              style={{
                ...backSwipe.getOverlayStyle(),
                width: "100vw",
                height: "100vh",
              }}
            />
          )}
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
export default function AppShell(props: AppShellProps) {
  return <AppShellInner {...props} />;
}
