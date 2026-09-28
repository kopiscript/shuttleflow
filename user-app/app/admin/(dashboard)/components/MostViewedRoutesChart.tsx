"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const COLORS = [
  "#96DDFF",
  "#3EB900",
  "#FEB002",
  "#FF6B6B",
  "#A855F7",
  "#F472B6",
  "#14B8A6",
  "#F59E0B",
];

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

  // Format date for display (e.g., "22 Sep")
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
  };

  // Export to CSV
  const handleExport = () => {
    if (chartData.length === 0) return;

    // Build CSV header
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

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `most-viewed-routes-${range}-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
          {/* Range filter */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-[#171821] text-white text-sm font-['Inter'] border border-[#2C2D33] rounded-lg px-3 py-2 focus:outline-none focus:border-[#96DDFF]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          {/* Route filter */}
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="bg-[#171821] text-white text-sm font-['Inter'] border border-[#2C2D33] rounded-lg px-3 py-2 focus:outline-none focus:border-[#96DDFF]"
          >
            <option value="">All Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routeName}
              </option>
            ))}
          </select>

          {/* Export button */}
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
        <div className="h-[350px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#96DDFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-[#87888C] font-['Inter'] text-sm">
            No view data yet.
          </p>
        </div>
      ) : (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2D33" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#87888C"
                style={{ fontSize: "12px", fontFamily: "Inter" }}
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
              <Legend
                wrapperStyle={{
                  fontFamily: "Inter",
                  fontSize: "12px",
                  color: "#87888C",
                }}
              />
              {series.map((s, i) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}