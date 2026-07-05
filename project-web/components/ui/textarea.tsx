import * as React from "react";
import { cn } from "@/lib/utils";
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex bg-background/50 px-4 py-3 border-none rounded-xl outline-1 outline-foreground ring-0 w-full min-h-25 md:text-sm text-base transition-[outline] duration-200 resize-y placeholder:text-muted-foreground",
        "focus:bg-primary/5",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background/90",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
export { Textarea };
