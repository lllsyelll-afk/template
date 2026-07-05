import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer place-content-center grid bg-primary-foreground data-[state=checked]:bg-primary border border-primary data-[state=checked]:disabled:opacity-50 rounded-full focus-visible:ring-white/30 w-4 h-4 data-[state=checked]:text-primary-foreground cursor-pointer disabled:cursor-not-allowed shrink-0",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("place-content-center grid text-current")}
    >
      <Check className="w-3.5 h-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export { Checkbox };
