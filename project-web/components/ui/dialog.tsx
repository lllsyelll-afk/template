import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "z-50 fixed inset-0 bg-black/60 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "top-[50%] data-[state=closed]:slide-out-to-bottom-[48%] data-[state=open]:slide-in-from-bottom-[48%] left-[50%] z-50 fixed flex flex-col gap-0 bg-background shadow-xl rounded-2xl w-11/12 max-h-[75vh] border border-border overflow-hidden translate-x-[-50%] translate-y-[-50%] data-[state=closed]:animate-out data-[state=open]:animate-in duration-200 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({
  className,
  children,
  hideX,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hideX?: boolean }) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 p-6 border-border border-b border-solid sm:text-left text-center",
      className,
    )}
    {...props}
  >
    {children}
    {!hideX && (
      <DialogPrimitive.Close className="top-4 right-4 absolute hover:bg-background/20 opacity-70 hover:opacity-100 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 transition-opacity disabled:pointer-events-none">
        <X className="w-5 h-5" /> <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    )}
  </div>
);
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex sm:justify-end sm:space-x-2 p-3 border-border border-t border-solid",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";
const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 p-6 min-h-0 overflow-y-auto", className)}
    {...props}
  />
);
DialogBody.displayName = "DialogBody";
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-heading font-semibold text-xl leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
