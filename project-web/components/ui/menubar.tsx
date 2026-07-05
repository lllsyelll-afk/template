import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />;
}
function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />;
}
function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />;
}
function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />;
}
function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}
const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-center space-x-1 shadow-sm p-1 border rounded-md h-9",
      className,
    )}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;
const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex items-center data-[state=open]:bg-muted focus:bg-muted px-3 py-1 rounded-sm outline-none font-medium data-[state=open]:text-muted-foreground focus:text-muted-foreground text-sm cursor-default select-none",
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;
const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex items-center data-[state=open]:bg-muted focus:bg-muted px-2 py-1.5 rounded-sm outline-none data-[state=open]:text-muted-foreground focus:text-muted-foreground text-sm cursor-default select-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children} <ChevronRight className="ml-auto w-4 h-4" />
  </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;
const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "data-[side=left]:slide-in-from-right-2 data-[side=top]:slide-in-from-bottom-2 z-50 bg-popover data-[side=bottom]:slide-in-from-top-2 data-[side=right]:slide-in-from-left-2 shadow-lg p-1 border rounded-md min-w-32 overflow-hidden text-popover-foreground origin-[--radix-menubar-content-transform-origin] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      className,
    )}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;
const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref,
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "data-[side=left]:slide-in-from-right-2 data-[side=top]:slide-in-from-bottom-2 z-50 bg-popover data-[side=bottom]:slide-in-from-top-2 data-[side=right]:slide-in-from-left-2 shadow-md p-1 border rounded-md min-w-48 overflow-hidden text-popover-foreground origin-[--radix-menubar-content-transform-origin] data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  ),
);
MenubarContent.displayName = MenubarPrimitive.Content.displayName;
const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex items-center focus:bg-muted data-disabled:opacity-50 px-2 py-1.5 rounded-sm outline-none focus:text-muted-foreground text-sm cursor-default data-disabled:pointer-events-none select-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;
const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex items-center focus:bg-muted data-disabled:opacity-50 py-1.5 pr-2 pl-8 rounded-sm outline-none focus:text-muted-foreground text-sm cursor-default data-disabled:pointer-events-none select-none",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="left-2 absolute flex justify-center items-center w-3.5 h-3.5">
      <MenubarPrimitive.ItemIndicator>
        <Check className="w-4 h-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;
const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex items-center focus:bg-muted data-disabled:opacity-50 py-1.5 pr-2 pl-8 rounded-sm outline-none focus:text-muted-foreground text-sm cursor-default data-disabled:pointer-events-none select-none",
      className,
    )}
    {...props}
  >
    <span className="left-2 absolute flex justify-center items-center w-3.5 h-3.5">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="fill-current w-4 h-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;
const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 font-semibold text-sm",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;
const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("bg-muted -mx-1 my-1 h-px", className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;
const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-muted-foreground text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
};
MenubarShortcut.displayname = "MenubarShortcut";
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
