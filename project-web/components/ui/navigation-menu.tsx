import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "z-10 relative flex flex-1 justify-center items-center max-w-max",
      className,
    )}
    {...props}
  >
    {children} <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;
const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 justify-center items-center space-x-1 list-none",
      className,
    )}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;
const NavigationMenuItem = NavigationMenuPrimitive.Item;
const navigationMenuTriggerStyle = cva(
  "group inline-flex justify-center items-center data-[state=open]:bg-muted data-[state=open]:hover:bg-muted data-[state=open]:focus:bg-muted hover:bg-muted focus:bg-muted disabled:opacity-50 px-4 py-2 rounded-md focus:outline-none w-max h-9 font-medium data-[state=open]:text-muted-foreground text-sm disabled:pointer-events-none",
);
const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}
    <ChevronDown
      className="top-px relative ml-1 w-3 h-3 group-data-[state=open]:rotate-180 transition duration-300"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;
const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "top-0 data-[motion=from-end]:slide-in-from-right-52 data-[motion=to-end]:slide-out-to-right-52 left-0 data-[motion=to-start]:slide-out-to-left-52 md:absolute data-[motion=from-start]:slide-in-from-left-52 w-full md:w-auto data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out",
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;
const NavigationMenuLink = NavigationMenuPrimitive.Link;
const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("top-full left-0 absolute flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "relative bg-popover shadow mt-1.5 border rounded-md w-full md:w-(--radix-navigation-menu-viewport-width) h-(--radix-navigation-menu-viewport-height) overflow-hidden text-popover-foreground origin-top-center data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90",
        className,
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName;
const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-1 flex justify-center items-end h-1.5 overflow-hidden data-[state=hidden]:animate-out data-[state=visible]:animate-in data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className,
    )}
    {...props}
  >
    <div className="top-[60%] relative shadow-md bg-border rounded-tl-sm w-2 h-2 rotate-45" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName;
export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
