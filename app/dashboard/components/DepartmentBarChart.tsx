"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DepartmentBarChartProps {
  data: Array<{ department: string; count: number }>;
}

const chartConfig = {
  count: {
    label: "SMEs",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function DepartmentBarChart({ data }: DepartmentBarChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="department"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={8} />
      </BarChart>
    </ChartContainer>
  );
}
