"use client";
import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  className?: string;
}

export default function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  trigger,
  className,
}: BottomSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
      modal
      dismissible
      direction="bottom"
    >
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="z-50 fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "bg-background z-50 fixed bottom-0 left-0 right-0 flex flex-col border-t border-border rounded-t-3xl overflow-hidden max-h-[90vh]",
            className,
          )}
        >
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0">
            <div className="bg-muted-foreground/40 rounded-full w-10 h-1.5" />
          </div>
          {title && (
            <div className="p-2 border-b border-border border-solid shrink-0">
              <Drawer.Title asChild>
                <div className="font-heading font-semibold text-center text-lg">
                  {title}
                </div>
              </Drawer.Title>
            </div>
          )}
          <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
