"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";

interface TrainingAreaChartProps {
  data: Array<{
    month: string;
    coursesDelivered: number;
    studentsEnrolled: number;
    avgSatisfaction: number;
  }>;
}

const chartConfig = {
  coursesDelivered: {
    label: "Courses Delivered",
    color: "hsl(var(--chart-1))",
  },
  studentsEnrolled: {
    label: "Students Enrolled",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function TrainingAreaChart({ data }: TrainingAreaChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend />
        <Area
          type="monotone"
          dataKey="coursesDelivered"
          fill="var(--color-coursesDelivered)"
          fillOpacity={0.4}
          stroke="var(--color-coursesDelivered)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="studentsEnrolled"
          fill="var(--color-studentsEnrolled)"
          fillOpacity={0.4}
          stroke="var(--color-studentsEnrolled)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
