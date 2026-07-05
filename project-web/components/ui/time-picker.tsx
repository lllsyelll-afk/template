"use client";
import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "../../node_modules/react-i18next";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog";
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}
function TimePicker({
  value,
  onChange,
  className,
  placeholder,
  disabled = false,
}: TimePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [period, setPeriod] = React.useState<"AM" | "PM">("AM");
  const [hour, setHour] = React.useState("07");
  const [minute, setMinute] = React.useState("00");
  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const isPM = h >= 12;
        setPeriod(isPM ? "PM" : "AM");
        const displayHour = isPM ? (h === 12 ? 12 : h - 12) : h === 0 ? 12 : h;
        setHour(String(displayHour).padStart(2, "0"));
        setMinute(String(m).padStart(2, "0"));
      }
    }
  }, [value]);
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(0, 2);
    const num = parseInt(val);
    if (num > 12) val = "12";
    if (val === "00") val = "12";
    setHour(val);
  };
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(0, 2);
    const num = parseInt(val);
    if (num > 59) val = "59";
    setMinute(val.padStart(2, "0"));
  };
  const commitTime = () => {
    let h = parseInt(hour) || 0;
    const m = parseInt(minute) || 0;
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(formatted);
  };
  const handleDone = () => {
    commitTime();
    setOpen(false);
  };
  const handleCancel = () => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const isPM = h >= 12;
        setPeriod(isPM ? "PM" : "AM");
        const displayHour = isPM ? (h === 12 ? 12 : h - 12) : h === 0 ? 12 : h;
        setHour(String(displayHour).padStart(2, "0"));
        setMinute(String(m).padStart(2, "0"));
      }
    }
    setOpen(false);
  };
  const resolvedPlaceholder = placeholder ?? "00-00";
  const displayValue = value || resolvedPlaceholder;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className={cn(
            "flex justify-start bg-background shadow-brutal-sm px-4 py-2 border-2 border-border rounded-xl w-full h-10 font-normal text-sm text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:shadow-brutal",
            !value && "text-muted-foreground",
            value && "text-foreground",
            className,
          )}
        >
          <Clock className="mr-0.5 w-4 h-4" /> {displayValue}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-4/5">
        <DialogBody>
          {/* Time Input Row */}
          <div className="flex justify-center items-center gap-2">
            {/* Hour */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-primary/20 shadow-brutal-sm border-2 border-border rounded-lg w-20 h-16">
                <input
                  type="text"
                  inputMode="numeric"
                  value={hour}
                  onChange={handleHourChange}
                  onBlur={() =>
                    setHour((prev) => prev.padStart(2, "0") || "12")
                  }
                  className="flex justify-center items-center outline-none w-full h-full font-semibold text-3xl text-center"
                  placeholder="00"
                  onFocus={(e) => {
                    e.currentTarget.select();
                  }}
                />
              </div>
              <span className="text-muted-foreground text-xs">
                {t("time_picker_hour")}
              </span>
            </div>
            <span className="font-bold text-2xl">:</span>
            <div className="flex flex-col items-center gap-1">
              <div className="bg-primary/20 shadow-brutal-sm border-2 border-border rounded-lg w-20 h-16">
                <input
                  type="text"
                  inputMode="numeric"
                  value={minute}
                  onChange={handleMinuteChange}
                  onBlur={() =>
                    setMinute((prev) => prev.padStart(2, "0") || "00")
                  }
                  className="flex justify-center items-center outline-none w-full h-full font-semibold placeholder:text-red-500 text-3xl text-center"
                  onFocus={(e) => {
                    e.currentTarget.select();
                  }}
                />
              </div>
              <span className="text-muted-foreground text-xs">
                {t("time_picker_minute")}
              </span>
            </div>
            {/* AM/PM Toggle */}
            <div className="flex flex-col gap-1 ml-2">
              <button
                onClick={() => setPeriod("AM")}
                className={cn(
                  "bg-primary/50 px-3 py-1.5 border-2 border-border rounded-lg font-medium text-sm cursor-pointer",
                  period === "AM" && "bg-primary text-primary-foreground",
                )}
              >
                {t("time_picker_am")}
              </button>
              <button
                onClick={() => setPeriod("PM")}
                className={cn(
                  "bg-primary/50 px-3 py-1.5 border-2 border-border rounded-lg font-medium text-sm cursor-pointer",
                  period === "PM" && "bg-primary text-primary-foreground",
                )}
              >
                {t("time_picker_pm")}
              </button>
            </div>
          </div>
          {/* Footer */}
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleCancel} className="w-full">
            {t("time_picker_cancel")}
          </Button>
          <Button onClick={handleDone} className="w-full">
            {t("time_picker_ok")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export { TimePicker };
