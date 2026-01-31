"use client";

import { useState } from "react";
import { Calendar, RefreshCw, Download, ChevronDown } from "lucide-react";
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
          className="flex items-center gap-2 px-3.5 py-2 bg-[#f3f3f5] hover:bg-gray-200 rounded-lg border border-transparent transition-colors"
        >
          <Calendar className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-medium text-gray-900">{selectedLabel}</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-700 transition-transform",
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
            <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleDateRangeSelect(range.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                    selectedRange === range.value
                      ? "text-blue-600 font-medium bg-blue-50"
                      : "text-gray-700"
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
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw
          className={cn(
            "w-4 h-4 text-gray-700",
            isRefreshing && "animate-spin"
          )}
        />
        <span className="text-sm font-medium text-gray-900">Refresh</span>
      </button>

      {/* Export Button */}
      <button
        onClick={onExport}
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
      >
        <Download className="w-4 h-4 text-gray-700" />
        <span className="text-sm font-medium text-gray-900">Export</span>
      </button>
    </div>
  );
}
