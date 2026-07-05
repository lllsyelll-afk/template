import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const alertVariants = cva(
  "[&>svg]:top-4 [&>svg]:left-4 [&>svg]:absolute relative bg-background px-4 py-3 [&>svg~*]:pl-8 border border-border rounded-xl w-full [&>svg]:w-4 [&>svg]:h-4 text-sm [&>svg]:",
  {
    variants: {},
    defaultVariants: {},
  },
);
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants(), className)}
    {...props}
  />
));
Alert.displayName = "Alert";
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-1 font-heading font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";
export { Alert, AlertTitle, AlertDescription };
