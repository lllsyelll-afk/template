import { cn } from "@/lib/utils";
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex justify-center items-center gap-1 bg-muted px-1 rounded-sm w-fit min-w-5 h-5 font-sans font-medium text-muted-foreground text-xs pointer-events-none select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        "in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background",
        className,
      )}
      {...props}
    />
  );
}
function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}
export { Kbd, KbdGroup };
