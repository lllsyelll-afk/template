import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  onChange: (buffer: string) => void;
  value: string | null;
  accept?: string;
  maxSize?: number;
  className?: string;
  name?: string;
}

export function PhotoUploader({
  onChange,
  value,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  className,
  name,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (maxSize && file.size > maxSize) {
        setError(
          `Image size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`,
        );
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
      };
      reader.onerror = () => {
        setError("Failed to read image");
      };
      reader.readAsDataURL(file);
    },
    [onChange, maxSize],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  // Reset image error when value changes
  useEffect(() => {
    setImageError(false);
  }, [value]);

  // Get initials for fallback if name is provided
  const getInitials = () => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "group relative border-2 border-border rounded-full w-28 h-28 cursor-pointer select-none",
          "shadow-brutal transition-all duration-200",
          "hover:shadow-brutal-md hover:-translate-y-0.5",
          "active:shadow-brutal-pressed active:translate-y-0.5",
          isDragging ? "bg-pastel-yellow scale-105 border-dashed" : "bg-card",
        )}
      >
        {/* Avatar/Photo Container */}
        <div className="flex justify-center items-center bg-muted rounded-full w-full h-full overflow-hidden">
          {value && !imageError ? (
            <img
              src={value}
              alt={name || "User photo"}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : name ? (
            <div className="flex justify-center items-center w-full h-full font-heading font-bold text-2xl">
              {getInitials()}
            </div>
          ) : (
            <UserIcon className="w-10 h-10 text-muted-foreground" />
          )}
        </div>

        {/* Small camera icon overlay at bottom-right corner */}
        <div
          className={cn(
            "-right-1 -bottom-1 absolute bg-background border-2 border-border rounded-full w-9 h-9",
            "flex items-center justify-center shadow-brutal-sm transition-transform duration-200",
            "group-hover:scale-110 active:scale-95",
          )}
        >
          <Camera className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p className="mt-1 font-medium text-red-500 text-xs text-center">
          {error}
        </p>
      )}
    </div>
  );
}
