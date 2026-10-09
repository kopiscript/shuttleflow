"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SmallDropdown from "./SmallDropdown";

interface Route {
  id: number;
  routeName: string;
}

interface Series {
  id: number;
  name: string;
}

interface ChartEntry {
  date: string;
  [routeName: string]: string | number;
}

const getColor = (index: number, total: number) => {
  const hue = (index * 360) / Math.max(total, 1);
  return `hsl(${hue}, 70%, 60%)`;
};

export default function MostViewedRoutesChart() {
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [range, setRange] = useState<string>("7d");
  const [totalViews, setTotalViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("range", range);
        if (selectedRouteId) {
          params.set("routeId", selectedRouteId);
        }

        const res = await fetch(
          `/api/admin/dashboard/most-viewed-routes?${params.toString()}`
        );
        const data = await res.json();

        if (data.success) {
          setChartData(data.chartData);
          setSeries(data.series);
          setRoutes(data.routes);
          setTotalViews(data.totalViews);
        }
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedRouteId, range]);

  const formatDate = (value: React.ReactNode): string => {
    if (typeof value !== "string") return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
  };

  const handleExport = () => {
    if (chartData.length === 0) return;

    const headers = ["Date", ...series.map((s) => s.name)];
    const rows = chartData.map((entry) => {
      const row = [entry.date];
      series.forEach((s) => {
        row.push(String(entry[s.name] ?? 0));
      });
      return row;
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `most-viewed-routes-${range}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-white font-bold font-['Inter'] text-base">
            Most Viewed Routes
          </h2>
          <p className="text-[#87888C] font-['Inter'] text-xs mt-1">
            {totalViews} total view{totalViews !== 1 ? "s" : ""} in the last{" "}
            {range === "7d" ? "7 days" : "30 days"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SmallDropdown
            value={range}
            onChange={setRange}
            options={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
            ]}
            width="w-36"
          />

          <SmallDropdown
            value={selectedRouteId}
            onChange={setSelectedRouteId}
            options={[
              { value: "", label: "All Routes" },
              ...routes.map((r) => ({
                value: String(r.id),
                label: r.routeName,
              })),
            ]}
            width="w-48"
          />

          <button
            onClick={handleExport}
            disabled={chartData.length === 0}
            className="px-4 py-2 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#96DDFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center">
          <p className="text-[#87888C] font-['Inter'] text-sm">
            No view data yet.
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="flex-1 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2D33" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#87888C"
                  style={{ fontSize: "12px", fontFamily: "Inter" }}
                  height={40}
                />
                <YAxis
                  stroke="#87888C"
                  style={{ fontSize: "12px", fontFamily: "Inter" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171821",
                    border: "1px solid #2C2D33",
                    borderRadius: "8px",
                    fontFamily: "Inter",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#FFFFFF" }}
                  labelFormatter={formatDate}
                />
                {series.map((s, i) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.name}
                    stroke={getColor(i, series.length)}
                    strokeWidth={2}
                    dot={{ r: 3, fill: getColor(i, series.length) }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend — natural height, no max-h clipping */}
          <div className="w-48 flex-shrink-0">
            <p className="text-[#87888C] font-['Inter'] text-xs uppercase tracking-wider mb-3">
              Routes
            </p>
            <div className="space-y-2">
              {series.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 w-full px-2 py-1.5"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColor(i, series.length) }}
                  />
                  <span className="text-white font-['Inter'] text-xs truncate">
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}