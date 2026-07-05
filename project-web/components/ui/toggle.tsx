import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const toggleVariants = cva(
  "inline-flex justify-center items-center gap-2 bg-transparent data-[state=on]:hover:bg-pastel-yellow disabled:opacity-50 shadow-brutal-sm active:shadow-brutal-pressed px-2 focus-visible:ring-border border-2 border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 min-w-9 h-9 [&_svg]:size-4 font-bold text-sm transition-transform active:translate-y-[2px] [&_svg]:pointer-events-none disabled:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: { size: "default" },
  },
);
const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ size, className }))}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;
export { Toggle, toggleVariants };
