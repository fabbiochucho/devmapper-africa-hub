
import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { mockReports } from "@/data/mockReports";
import { sdgGoals, sdgGoalColors } from "@/lib/constants";

const SdgDistributionChart = () => {
  const sdgGoalMap = new Map(sdgGoals.map((g) => [g.value, g.label.replace(/Goal \d+: /, '')]));

  const data = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    mockReports.forEach((report) => {
      counts[report.sdg_goal] = (counts[report.sdg_goal] || 0) + 1;
    });

    return sdgGoals.map(goal => ({
      name: sdgGoalMap.get(goal.value) || `Goal ${goal.value}`,
      value: counts[goal.value] || 0,
      fill: sdgGoalColors[goal.value],
    })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);
  }, []);

  const chartConfig = {
      value: { label: "Projects" },
  } as ChartConfig;
  data.forEach(item => {
    chartConfig[item.name] = {
      label: item.name,
      color: item.fill,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects by SDG Goal</CardTitle>
        <CardDescription>Distribution of projects across different SDGs.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={150}
              tick={{ fontSize: 12 }}
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Bar dataKey="value" radius={4}>
                {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} className="fill-[--color-value]" />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SdgDistributionChart;
