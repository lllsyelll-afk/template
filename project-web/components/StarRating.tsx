import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;
  const starClass = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          >
            <Star
              className={`${starClass} ${isFilled ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-gray-300"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
