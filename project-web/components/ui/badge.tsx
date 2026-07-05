import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva(
  "inline-flex items-center bg-primary text-primary-foreground px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring/20 font-medium text-xs whitespace-nowrap",
  {
    variants: {},
    defaultVariants: {},
  },
);
export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
function Badge({ className, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants(), className)} {...props} />;
}
export { Badge, badgeVariants };
