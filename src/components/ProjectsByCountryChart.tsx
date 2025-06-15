
import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { mockReports } from "@/data/mockReports";
import { countries } from "@/data/countries";

const ProjectsByCountryChart = () => {
  const countryMap = new Map(countries.map((c) => [c.value, c.label]));

  const data = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    mockReports.forEach((report) => {
      if (report.country_code) {
        counts[report.country_code] = (counts[report.country_code] || 0) + 1;
      }
    });

    const colorPalette = [
      '#26BDE2', '#4A4AFF', '#F37021', '#E0265A', 
      '#743482', '#00A99D', '#FDB913', '#A7A9AC'
    ];

    return Object.entries(counts).map(([countryCode, count], index) => ({
      name: countryMap.get(countryCode) || countryCode,
      value: count,
      fill: colorPalette[index % colorPalette.length],
    })).sort((a, b) => b.value - a.value);
  }, []);

  const chartConfig = {
      value: { label: "Projects" },
      ...Object.fromEntries(data.map(item => [item.name, { label: item.name, color: item.fill }]))
  } as ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects by Country</CardTitle>
        <CardDescription>Distribution of projects across different countries.</CardDescription>
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
              width={100}
              tick={{ fontSize: 12 }}
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

export default ProjectsByCountryChart;
