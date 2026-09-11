"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TrendingUp, BarChart3 } from "lucide-react";

interface SalesDataPoint {
  date: string;
  revenue: number;
  transactions: number;
}

interface DashboardChartProps {
  data: SalesDataPoint[];
}

const chartConfig = {
  revenue: {
    label: "Pendapatan (Rp)",
    color: "var(--primary)",
  },
  transactions: {
    label: "Transaksi",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export function DashboardChart({ data }: DashboardChartProps) {
  const [timeRange, setTimeRange] = React.useState("30d");

  // Filter data based on timeRange
  const filteredData = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return data.slice(-days);
  }, [data, timeRange]);

  const totalRangeRevenue = React.useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [filteredData]);

  const totalRangeTransactions = React.useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.transactions, 0);
  }, [filteredData]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Tren Penjualan & Pendapatan
          </CardTitle>
          <CardDescription className="text-xs">
            Total {timeRange === "7d" ? "7 Hari" : timeRange === "30d" ? "30 Hari" : "3 Bulan"}{" "}
            Terakhir:{" "}
            <strong className="text-foreground font-semibold">
              Rp {totalRangeRevenue.toLocaleString("id-ID")}
            </strong>{" "}
            ({totalRangeTransactions} Transaksi)
          </CardDescription>
        </div>

        <ToggleGroup
          type="single"
          value={timeRange}
          onValueChange={(val) => val && setTimeRange(val)}
          variant="outline"
          className="h-8"
        >
          <ToggleGroupItem value="7d" className="text-xs h-7 px-3">
            7 Hari
          </ToggleGroupItem>
          <ToggleGroupItem value="30d" className="text-xs h-7 px-3">
            30 Hari
          </ToggleGroupItem>
          <ToggleGroupItem value="90d" className="text-xs h-7 px-3">
            3 Bulan
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="pt-6 px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                });
              }}
              className="text-[11px] text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                return val;
              }}
              className="text-[11px] text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload as SalesDataPoint;
                  const dateStr = new Date(dataPoint.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                  return (
                    <div className="bg-popover text-popover-foreground p-3 rounded-lg border shadow-md text-xs space-y-1.5 min-w-[180px]">
                      <p className="font-semibold text-foreground border-b pb-1">{dateStr}</p>
                      <div className="flex justify-between items-center text-primary font-bold">
                        <span>Pendapatan:</span>
                        <span>Rp {dataPoint.revenue.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Jumlah Struk:</span>
                        <span>{dataPoint.transactions} transaksi</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--primary)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
