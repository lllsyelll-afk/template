import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "top-0 z-100 fixed inset-x-0 flex flex-col items-center mx-auto p-4 w-fit max-w-[90vw] sm:max-w-full max-h-screen",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group data-[state=closed]:slide-out-to-top-full data-[swipe=end]:slide-out-to-top-full relative flex justify-between items-center space-x-2 bg-background data-[state=open]:slide-in-from-top-full shadow-lg p-2 pr-6 border border-border border-border rounded-2xl w-fit max-w-2/3 overflow-hidden transition-all data-[swipe=move]:transition-none data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[swipe=end]:animate-out pointer-events-auto data-[state=closed]:fade-out-80",
  {
    variants: {},
    defaultVariants: {},
  },
);
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants(), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex justify-center items-center bg-transparent hover:bg-secondary group-[.destructive]:hover:bg-destructive disabled:opacity-50 px-3 border group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 rounded-md focus:outline-none focus:ring-2 focus:ring-ring group-[.destructive]:focus:ring-destructive ring-offset-background focus:ring-offset-2 h-8 font-medium text-sm disabled:pointer-events-none shrink-0",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "top-3 right-3 absolute hover:bg-muted opacity-0 focus:opacity-100 group-hover:opacity-100 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 text-muted-foreground transition-opacity",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="w-4 h-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("font-semibold text-sm", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("opacity-90 text-sm", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
