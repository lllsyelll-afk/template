import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "../../node_modules/react-i18next";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Input } from "@components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@components/ui/dialog";
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}
function DatePicker({
  value,
  onChange,
  className,
  placeholder,
  disabled = false,
}: DatePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    const date = parse(value, "yyyy-MM-dd HH:mm", new Date());
    return isValid(date) ? date : undefined;
  }, [value]);
  const timeValue = React.useMemo(() => {
    if (!value || !parsedDate) return "";
    return format(parsedDate, "HH:mm");
  }, [value, parsedDate]);
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const currentTime = parsedDate || new Date();
    const hours = parsedDate ? currentTime.getHours() : 0;
    const minutes = parsedDate ? currentTime.getMinutes() : 0;
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    const formattedValue = format(newDate, "yyyy-MM-dd HH:mm");
    onChange(formattedValue);
  };
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeStr)) {
      if (timeStr.length <= 5) {
        return;
      }
    }
    const baseDate = parsedDate || new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hours || 0);
    newDate.setMinutes(minutes || 0);
    const formattedValue = format(newDate, "yyyy-MM-dd HH:mm");
    onChange(formattedValue);
  };
  const resolvedPlaceholder = placeholder ?? t("date_picker_select_date_time");
  const displayValue = React.useMemo(() => {
    if (!parsedDate) return "";
    return format(parsedDate, "MMM d, yyyy HH:mm");
  }, [parsedDate]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className={cn(
            "flex justify-start bg-card shadow-brutal-sm px-4 py-2 border-2 border-border rounded-xl w-full h-10 font-normal text-sm text-left",
            "hover:shadow-brutal hover:bg-card",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:shadow-brutal",
            !parsedDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 w-4 h-4" />
          {parsedDate ? displayValue : resolvedPlaceholder}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-popover shadow-brutal-lg p-4 border-2 border-border sm:rounded-2xl w-full max-w-sm">
        <div className="flex flex-col gap-4">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex items-center gap-2 pt-2 border-border border-t-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{t("date_picker_time_label")}</span>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-30"
            />
          </div>
          <Button onClick={() => setOpen(false)} className="w-full">
            {t("date_picker_done")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export { DatePicker };
