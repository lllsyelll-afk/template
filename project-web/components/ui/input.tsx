import * as React from "react";
import { cn } from "@/lib/utils";
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex bg-background/50 px-4 py-3 border-none rounded-xl outline-1 outline-foreground ring-0 w-full h-12 text-sm transition-[outline] duration-200 placeholder:text-muted-foreground",
          "focus:bg-primary/5",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background/90",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
export { Input };
