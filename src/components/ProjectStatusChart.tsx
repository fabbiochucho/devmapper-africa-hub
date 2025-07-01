
import React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { mockReports } from "@/data/mockReports";
import { projectStatuses, projectStatusChartColors } from "@/lib/constants";

const ProjectStatusChart = () => {
    const projectStatusMap = new Map(projectStatuses.map(s => [s.value, s.label]));

    const data = React.useMemo(() => {
        const counts: { [key: string]: number } = {};
        mockReports.forEach((report) => {
            counts[report.project_status] = (counts[report.project_status] || 0) + 1;
        });
        
        return Object.entries(counts).map(([status, count]) => ({
            name: projectStatusMap.get(status) || status,
            value: count,
            fill: projectStatusChartColors[status] || '#94A3B8'
        }));
    }, [projectStatusMap]);

    const chartConfig = {} as ChartConfig;
    data.forEach(item => {
        const configKey = item.name as string;
        chartConfig[configKey] = {
            label: item.name,
            color: item.fill,
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>A donut chart showing the current status of all projects.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80}>
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export default ProjectStatusChart;
