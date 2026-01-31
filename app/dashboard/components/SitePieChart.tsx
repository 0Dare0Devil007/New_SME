"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface SitePieChartProps {
  data: Array<{ site: string; count: number }>;
}

const chartConfig = {
  count: {
    label: "SMEs",
  },
} satisfies ChartConfig;

export default function SitePieChart({ data }: SitePieChartProps) {
  // Add color to each data item
  const chartData = data.map((item, index) => ({
    ...item,
    fill: `hsl(var(--chart-${(index % 8) + 1}))`,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="site"
          label
        />
      </PieChart>
    </ChartContainer>
  );
}
