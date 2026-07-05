import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("gap-2 grid", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "bg-primary data-[state=checked]:disabled:opacity-50 border-2 border-border data-[state=checked]:border-white hover:border-border rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 w-5 h-5 aspect-square transition-all duration-200 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex justify-center items-center">
        <Circle className="fill-primary w-2.5 h-2.5" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
export { RadioGroup, RadioGroupItem };
