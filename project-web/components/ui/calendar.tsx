"use client";
import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@components/ui/button";
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers?.focused) ref.current?.focus();
  }, [modifiers?.focused]);
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent p-3 [--cell-size:2rem]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex md:flex-row flex-col gap-4",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col gap-4 w-full", defaultClassNames.month),
        nav: cn(
          "top-0 absolute inset-x-0 flex justify-between items-center gap-1 w-full",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "aria-disabled:opacity-50 p-0 w-[--cell-size] h-[--cell-size] select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "aria-disabled:opacity-50 p-0 w-[--cell-size] h-[--cell-size] select-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex justify-center items-center px-[--cell-size] w-full h-[--cell-size]",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex justify-center items-center gap-1.5 w-full h-[--cell-size] font-medium text-sm",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative shadow-xs border border-input has-focus:border-ring rounded-md has-focus:ring-[3px] has-focus:ring-ring/50",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-md font-normal text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex mt-2 w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative p-0 [&:last-child[data-selected=true]_button]:rounded-r-md [&:first-child[data-selected=true]_button]:rounded-l-md w-full h-full aspect-square text-center select-none",
          defaultClassNames.day,
        ),
        range_start: cn(
          "bg-primary rounded-l-md",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-primary rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-secondary rounded-md data-[selected=true]:rounded-none text-white",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "opacity-50 text-muted-foreground",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex justify-center items-center size-[--cell-size] text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);
  return (
    <Button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:relative flex flex-col gap-1 data-[range-end=true]:bg-primary data-[range-middle=true]:bg-muted data-[range-start=true]:bg-primary data-[selected-single=true]:bg-primary [&>span]:opacity-70 group-data-[focused=true]/day:border-ring data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 w-full min-w-[--cell-size] h-auto aspect-square font-normal data-[range-end=true]:text-primary-foreground data-[range-middle=true]:text-muted-foreground data-[range-start=true]:text-primary-foreground data-[selected-single=true]:text-primary-foreground [&>span]:text-xs leading-none",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}
export { Calendar, CalendarDayButton };
