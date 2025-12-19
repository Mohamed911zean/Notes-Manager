import React, { useEffect, useRef } from "react";
import { useAnalyticsStore, formatTime } from "../stores/AnaliticsStore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Tooltip,
  Legend
);

export default function Overview() {
  // Get functions from store
  const {
    getTotalToday,
    getCountToday,
    getAverageToday,
    getWeekTotal,
    getWeeklyData
  } = useAnalyticsStore();

  // Call the functions to get values
  const totalToday = getTotalToday();
  const countToday = getCountToday();
  const averageToday = getAverageToday();
  const weekTotal = getWeekTotal();
  const weeklyData = getWeeklyData();

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  useEffect(() => {
    // Only create charts if we have data
    if (!weeklyData || weeklyData.length === 0) return;

    // Destroy existing charts before creating new ones
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }
    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }

    // Bar Chart - Weekly Sessions
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext("2d");
      barChartInstance.current = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: weeklyData.map((d) => d.day),
          datasets: [
            {
              label: "Sessions",
              data: weeklyData.map((d) => d.count),
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              hoverBackgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 4,
              borderSkipped: false,
              barThickness: 20,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#18181b",
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 12, weight: "500", family: "sans-serif" },
              bodyFont: { size: 12, family: "sans-serif" },
              borderColor: "#27272a",
              borderWidth: 1,
              displayColors: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              display: false,
            },
            x: {
              ticks: { color: "#52525b", font: { size: 10, family: "sans-serif" } },
              grid: { display: false },
            },
          },
        },
      });
    }

    // Line Chart - Daily Minutes
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext("2d");
      lineChartInstance.current = new ChartJS(ctx, {
        type: "line",
        data: {
          labels: weeklyData.map((d) => d.day),
          datasets: [
            {
              label: "Minutes",
              data: weeklyData.map((d) => d.total / 60),
              borderColor: "#52525b",
              borderWidth: 2,
              backgroundColor: "transparent",
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#18181b",
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 12, weight: "500", family: "sans-serif" },
              bodyFont: { size: 12, family: "sans-serif" },
              borderColor: "#27272a",
              borderWidth: 1,
              displayColors: false,
              callbacks: {
                label: (context) => `${context.parsed.y.toFixed(0)} min`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              display: false,
            },
            x: {
              ticks: { color: "#52525b", font: { size: 10, family: "sans-serif" } },
              grid: { display: false },
            },
          },
        },
      });
    }

    // Cleanup function
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
        barChartInstance.current = null;
      }
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
    };
  }, [weeklyData]);

  return (
    <div className="h-full overflow-y-auto bg-transparent custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>

      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Performance Metrics</p>
      </div>

      <div className="px-4 space-y-4 pb-24">
        {/* Stats Cards - Minimal Style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Total Today</div>
            <div className="text-2xl font-semibold text-zinc-100">{formatTime(totalToday)}</div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Sessions</div>
            <div className="text-2xl font-semibold text-zinc-100">{countToday}</div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Average</div>
            <div className="text-2xl font-semibold text-zinc-100">{formatTime(Math.floor(averageToday))}</div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">This Week</div>
            <div className="text-2xl font-semibold text-zinc-100">{formatTime(weekTotal)}</div>
          </div>
        </div>

        {/* Charts - Minimal Style */}
        <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Weekly Sessions</h3>
              <p className="text-[10px] text-zinc-500">Sessions per day</p>
            </div>
          </div>
          {weeklyData && weeklyData.length > 0 ? (
            <div className="h-40">
              <canvas ref={barChartRef}></canvas>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-zinc-600">
              <p className="text-xs font-medium text-zinc-500">No data available</p>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Daily Focus</h3>
              <p className="text-[10px] text-zinc-500">Minutes per day</p>
            </div>
          </div>
          {weeklyData && weeklyData.length > 0 ? (
            <div className="h-40">
              <canvas ref={lineChartRef}></canvas>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-zinc-600">
              <p className="text-xs font-medium text-zinc-500">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}