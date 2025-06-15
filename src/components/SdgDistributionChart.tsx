
import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { mockReports } from "@/data/mockReports";
import { sdgGoals, sdgGoalColors } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import SdgIcon from "./landing/SdgIcon";

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

  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const goalInfo = sdgGoals.find(g => sdgGoalMap.get(g.value) === payload.value);

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-160} y={-12} width="150" height="24">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-end gap-2 w-full pr-2 cursor-help">
                  <p className="text-xs text-right truncate">{payload.value}</p>
                  {goalInfo && <SdgIcon goal={goalInfo.value} className="w-5 h-5 !text-xs" />}
                </div>
              </TooltipTrigger>
              {goalInfo && <TooltipContent><p>{goalInfo.label}</p></TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </foreignObject>
      </g>
    );
  };

  const chartHeight = Math.max(400, data.length * 40);

  return (
    <Card>
      <CardHeader>
        <CardTitle>SDG Goals Distribution</CardTitle>
        <CardDescription>Distribution of projects across all SDGs.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height: `${chartHeight}px` }} className="w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={150}
              tick={<CustomYAxisTick />}
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Bar dataKey="value" radius={4}>
                {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SdgDistributionChart;
