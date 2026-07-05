import { useEffect, createRef, useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@components/ui/input";
import { cn } from "@/lib/utils";
export interface InputDropDownProps<T> {
  value: string;
  onChange: (value: string) => void;
  itemRender: (
    data: T,
    index: number,
    opts: { highlighted: boolean },
  ) => React.ReactNode;
  list: T[];
  onScrollRef?: (element: HTMLDivElement) => void;
  onSearchRef?: (element: HTMLInputElement) => void;
  onSelect?: (item: T) => void;
  placeholder?: string;
  onScrollWillDone?: () => void;
  position?: "top" | "bottom";
  maxLength?: number;
  itemHeight?: number;
  selectedData?: T | null;
  selectedRender?: (data: T) => React.ReactNode;
}
export function InputDropDown<T>({
  value,
  onChange,
  itemRender,
  list,
  onSelect,
  placeholder = "Search",
  onScrollRef,
  onSearchRef,
  onScrollWillDone,
  position = "bottom",
  maxLength,
  itemHeight = 40,
  selectedData = null,
  selectedRender,
}: InputDropDownProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [justSelected, setJustSelected] = useState(false);
  const searchRef = createRef<HTMLInputElement>();
  const dropdownRef = createRef<HTMLDivElement>();
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fuzzy search function
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query) return true;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match
    if (textLower.includes(queryLower)) return true;

    // Fuzzy match - check if all characters from query exist in text in order
    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < textLower.length && queryIndex < queryLower.length) {
      if (textLower[textIndex] === queryLower[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === queryLower.length;
  };

  // Filter list based on search value using fuzzy search
  const filteredList = list.filter((item) => {
    // Handle both string items and object items with value/label properties
    const searchText =
      typeof item === "string"
        ? item
        : (item as { value?: string; label?: string }).label ||
          (item as { value?: string; label?: string }).value ||
          String(item);
    return fuzzyMatch(searchText, value);
  });

  const rowVirtualizer = useVirtualizer({
    count: filteredList.length,
    getScrollElement: () => dropdownRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });
  useEffect(() => {
    if (onSearchRef && searchRef.current) {
      onSearchRef(searchRef.current);
    }
  }, [onSearchRef, searchRef]);
  useEffect(() => {
    if (onScrollRef && dropdownRef.current) {
      onScrollRef(dropdownRef.current);
    }
  }, [onScrollRef, dropdownRef]);
  useEffect(() => {
    if (justSelected) {
      const timer = setTimeout(() => setJustSelected(false), 100);
      return () => clearTimeout(timer);
    }
  }, [justSelected]);
  useEffect(() => {
    const highlightedItem = itemRefs.current[highlightIndex];
    if (highlightedItem) {
      highlightedItem.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [highlightIndex]);
  return (
    <div className="relative space-y-1">
      {selectedData !== null && selectedRender ? (
        selectedRender(selectedData)
      ) : (
        <>
          <Input
            ref={searchRef}
            value={value}
            maxLength={maxLength}
            onChange={(e) => {
              onChange(e.target.value);
              setShowDropdown(true);
              setHighlightIndex(0);
            }}
            onFocus={() => {
              if (!justSelected) {
                setShowDropdown(true);
                setHighlightIndex(0);
              }
            }}
            onBlur={() => {
              setShowDropdown(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((prev) =>
                  Math.min(prev + 1, filteredList.length - 1),
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const c = filteredList[highlightIndex];
                if (c) {
                  setJustSelected(true);
                  onSelect?.(c);
                  setShowDropdown(false);
                }
              } else if (e.key === "Escape") {
                setShowDropdown(false);
              }
            }}
            placeholder={placeholder}
            className="text-xs"
          />
          {/* Dropdown for existing cars */}
          {showDropdown && filteredList.length > 0 && (
            <div
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
                  onScrollWillDone?.();
                }
              }}
              ref={dropdownRef}
              className={cn(
                "z-50 absolute bg-background shadow-md border border-border rounded-md w-full max-h-60 overflow-auto",
                position === "top" ? "bottom-full mb-1" : "mt-1",
              )}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const c = filteredList[virtualRow.index];
                  return (
                    <div
                      className="cursor-pointer"
                      key={virtualRow.index}
                      ref={(el) => {
                        itemRefs.current[virtualRow.index] = el;
                      }}
                      onPointerDown={() => {
                        setJustSelected(true);
                        onSelect?.(c);
                      }}
                      onMouseEnter={() => setHighlightIndex(virtualRow.index)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {itemRender(c, virtualRow.index, {
                        highlighted: virtualRow.index === highlightIndex,
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
