"use client";

import { useState } from "react";
import { RiCalendarLine, RiRefreshLine, RiDownloadLine, RiArrowDownSLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

interface DashboardFiltersProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onDateRangeChange?: (range: string) => void;
}

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
  { value: "all", label: "All time" },
];

export default function DashboardFilters({
  onRefresh,
  onExport,
  onDateRangeChange,
}: DashboardFiltersProps) {
  const [selectedRange, setSelectedRange] = useState("30");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDateRangeSelect = (value: string) => {
    setSelectedRange(value);
    setIsDropdownOpen(false);
    onDateRangeChange?.(value);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const selectedLabel = DATE_RANGES.find((r) => r.value === selectedRange)?.label || "Last 30 days";

  return (
    <div className="flex items-center gap-3">
      {/* Date Range Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3.5 py-2 bg-muted hover:bg-accent rounded-lg border border-transparent transition-colors"
        >
          <RiCalendarLine className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">{selectedLabel}</span>
          <RiArrowDownSLine
            className={cn(
              "w-4 h-4 text-foreground transition-transform",
              isDropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 w-40 bg-popover rounded-lg shadow-lg border border-border py-1 z-20">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleDateRangeSelect(range.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                    selectedRange === range.value
                      ? "text-primary font-medium bg-primary/10"
                      : "text-popover-foreground"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted rounded-lg border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RiRefreshLine
          className={cn(
            "w-4 h-4 text-foreground",
            isRefreshing && "animate-spin"
          )}
        />
        <span className="text-sm font-medium text-foreground">Refresh</span>
      </button>

      {/* Export Button */}
      <button
        onClick={onExport}
        className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted rounded-lg border border-border transition-colors"
      >
        <RiDownloadLine className="w-4 h-4 text-foreground" />
        <span className="text-sm font-medium text-foreground">Export</span>
      </button>
    </div>
  );
}
