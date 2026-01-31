"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";

interface ActivityLineChartProps {
  data: Array<{
    week: string;
    profileViews: number;
    searches: number;
    endorsements: number;
  }>;
}

const chartConfig = {
  profileViews: {
    label: "Profile Views",
    color: "hsl(var(--chart-1))",
  },
  searches: {
    label: "Searches",
    color: "hsl(var(--chart-2))",
  },
  endorsements: {
    label: "Endorsements",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function ActivityLineChart({ data }: ActivityLineChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend />
        <Line
          type="monotone"
          dataKey="profileViews"
          stroke="var(--color-profileViews)"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="searches"
          stroke="var(--color-searches)"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="endorsements"
          stroke="var(--color-endorsements)"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
