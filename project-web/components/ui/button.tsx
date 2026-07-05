import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Ripple = { id: number; x: number; y: number; size: number };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, onClick, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const rippleId = React.useRef(0);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = rippleId.current++;
      setRipples((prev) => [...prev, { id, x, y, size }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
      onClick?.(e);
    };

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "relative overflow-hidden inline-flex justify-center items-center gap-2 bg-primary disabled:opacity-50 shadow-md hover:shadow-lg p-3 sm:p-4 border border-border border-solid rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 h-12 [&_svg]:size-4 font-semibold text-primary-foreground text-sm whitespace-nowrap active:translate-y-0.5 transition-transform duration-75 ease-out cursor-pointer [&_svg]:pointer-events-none disabled:pointer-events-none [&_svg]:shrink-0",
          className,
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {asChild ? (
          props.children
        ) : (
          <>
            {ripples.map((r) => (
              <span
                key={r.id}
                className="pointer-events-none absolute rounded-full bg-white/30 animate-ripple"
                style={{
                  left: r.x,
                  top: r.y,
                  width: r.size,
                  height: r.size,
                }}
              />
            ))}
            {props.children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
export { Button };
