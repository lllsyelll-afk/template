"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "completed" | "success";
  }
>(({ className, value, variant = "default", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative bg-muted rounded-full w-full h-2.5 overflow-hidden",
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "flex-1 rounded-full w-full h-full transition-all duration-300",
        variant === "default" && "bg-primary",
        variant === "completed" && "bg-primary",
        variant === "success" && "bg-success",
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;
export { Progress };
