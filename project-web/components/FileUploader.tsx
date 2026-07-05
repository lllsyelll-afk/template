import React, { useCallback, useRef, useState, useEffect } from "react";
import { Upload, FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@components/ui/button";
interface FileUploaderProps {
  onChange: (buffer: string) => void;
  value: string | null;
  accept?: string;
  maxSize?: number;
  className?: string;
}
export function FileUploader({
  onChange,
  value,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (maxSize && file.size > maxSize) {
        setError(
          `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`,
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
      };
      reader.onerror = () => {
        setError("Failed to read file");
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
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    },
    [processFile],
  );
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("paste", handlePaste);
    return () => {
      container.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);
  const handleClick = () => {
    inputRef.current?.click();
  };
  const handleClear = () => {
    onChange("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  const getFileName = () => {
    if (!value) return null;
    try {
      const match = value.match(/data:.*;name=([^;]*)/);
      if (match) return match[1];
      return "Uploaded file";
    } catch {
      return "Uploaded file";
    }
  };
  const isImage = () => {
    if (!value) return false;
    return value.startsWith("data:image/");
  };
  return (
    <div ref={containerRef} className={cn("w-full", className)} tabIndex={0}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      {!value ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col justify-center items-center gap-3 p-8",
            "border-2 border-dashed border-border rounded-xl cursor-pointer",
            "bg-background",
            "shadow-brutal hover:shadow-brutal-hover hover:-translate-y-0.5",
            "active:shadow-brutal-pressed active:translate-y-0.5",
            isDragging && "bg-pastel-yellow border-border scale-[1.02]",
          )}
        >
          <div
            className={cn(
              "flex justify-center items-center rounded-lg w-14 h-14",
              "bg-pastel-green transition-transform duration-200",
              isDragging && "scale-110",
            )}
          >
            <Upload className="w-7 h-7" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">
              Click to upload, drag & drop, or paste a file
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 p-4",
            "border-2 border-border rounded-xl bg-card",
            "shadow-brutal",
          )}
        >
          {isImage() ? (
            <img
              src={value}
              alt="Preview"
              className="rounded-lg w-16 h-16 object-cover shrink-0"
            />
          ) : (
            <div className="flex justify-center items-center bg-pastel-green rounded-lg w-10 h-10 shrink-0">
              <FileIcon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{getFileName()}</p>
            <p className="text-muted-foreground text-xs">
              {isImage() ? "Image uploaded" : "File uploaded"}
            </p>
          </div>
          <Button onClick={handleClear} className="w-8 h-8 shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      {error && (
        <p className="mt-2 font-medium text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
}
