"use client";

interface ProgressBarProps {
  value: number;
  maxValue: number;
  label: string;
  count: number;
  growth: number;
  rank: number;
}

export default function SkillProgressBar({
  value,
  maxValue,
  label,
  count,
  growth,
  rank,
}: ProgressBarProps) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{count.toLocaleString()} searches</span>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            +{growth}%
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
