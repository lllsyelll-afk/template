import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "@/lib/utils";
const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "data-[side=left]:slide-in-from-right-2 data-[side=top]:slide-in-from-bottom-2 z-50 bg-popover data-[side=bottom]:slide-in-from-top-2 data-[side=right]:slide-in-from-left-2 shadow-brutal p-4 border-2 border-border rounded-xl outline-none w-64 text-popover-foreground origin-[--radix-hover-card-content-transform-origin] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      className,
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
export { HoverCard, HoverCardTrigger, HoverCardContent };
