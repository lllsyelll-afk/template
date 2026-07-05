import { cn } from "@/lib/utils";
import type React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTouchToClose } from "@/hooks/useGestures";

interface SidebarProps {
  path: string;
  isRTL: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
}

export function Sidebar({
  isRTL,
  isMobileOpen,
  onClose,
  sidebarRef,
}: SidebarProps) {
  const { t } = useTranslation();
  const touchHandlers = useTouchToClose(onClose);

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className={cn(
          "hidden top-0 bottom-0 z-30 fixed md:flex flex-col bg-background shadow-xl w-[210px] h-full",
          isRTL
            ? "right-0 border-l border-border"
            : "left-0 border-r border-border",
        )}
      >
        <div className="flex items-center p-4 border-border border-b h-16.25">
          <span className="font-semibold text-2xl">{t("app_title")}</span>
        </div>
        <div className="flex-1 p-2 overflow-y-auto" />
      </nav>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden z-40 fixed inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          onTouchStart={touchHandlers.handleTouchStart}
        />
      )}

      {/* Mobile Drawer */}
      <nav
        ref={sidebarRef}
        className={cn(
          "md:hidden top-0 bottom-0 z-50 fixed flex flex-col bg-background shadow-xl w-3/4 transition-transform duration-300",
          isRTL
            ? "right-0 border-l border-border"
            : "left-0 border-r border-border",
          isMobileOpen
            ? "translate-x-0"
            : isRTL
              ? "translate-x-full"
              : "-translate-x-full",
        )}
      >
        <div className="flex justify-between items-center p-4 border-border border-b">
          <span className="font-semibold text-2xl">{t("app_title")}</span>
          <button onClick={onClose} className="p-1 rounded-md">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 p-2" />
      </nav>
    </>
  );
}