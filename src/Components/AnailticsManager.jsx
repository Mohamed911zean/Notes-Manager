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
  const getTotalToday = useAnalyticsStore(state => state.getTotalToday);
  const getCountToday = useAnalyticsStore(state => state.getCountToday);
  const getAverageToday = useAnalyticsStore(state => state.getAverageToday);
  const getWeekTotal = useAnalyticsStore(state => state.getWeekTotal);
  const getWeeklyData = useAnalyticsStore(state => state.getWeeklyData);
  
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
              backgroundColor: "rgba(74, 222, 128, 0.8)",
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 14, weight: "600" },
              bodyFont: { size: 13 },
              borderColor: "rgba(113, 113, 122, 0.3)",
              borderWidth: 1,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              display: true,
            },
            x: {
              ticks: { color: "#71717a", font: { size: 11 } },
              grid: { display: true },
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
              borderColor: "rgba(96, 165, 250, 1)",
              backgroundColor: "rgba(96, 165, 250, 0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: "#60a5fa",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 14, weight: "600" },
              bodyFont: { size: 13 },
              borderColor: "rgba(113, 113, 122, 0.3)",
              borderWidth: 1,
              callbacks: {
                label: (context) => `${context.parsed.y.toFixed(1)} min`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              display: true,
            },
            x: {
              ticks: { color: "#71717a", font: { size: 11 } },
              grid: { display: true },
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
    <div className="h-full overflow-y-auto bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <p className="text-xs md:text-sm text-zinc-500 mt-1">Track your focus sessions</p>
      </div>

      <div className="px-4 space-y-3 pb-24">
        {/* Stats Cards - Dark iOS Style with Glass Effect */}
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
          <div className="glass-dark p-3 md:p-5 rounded-2xl md:rounded-3xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-0.5 md:mb-1">Total Today</div>
            <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">{formatTime(totalToday)}</div>
          </div>

          <div className="glass-dark p-3 md:p-5 rounded-2xl md:rounded-3xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-3 h-3 md:w-4 md:h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-0.5 md:mb-1">Sessions</div>
            <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">{countToday}</div>
          </div>

          <div className="glass-dark p-3 md:p-5 rounded-2xl md:rounded-3xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-0.5 md:mb-1">Average</div>
            <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">{formatTime(Math.floor(averageToday))}</div>
          </div>

          <div className="glass-dark p-3 md:p-5 rounded-2xl md:rounded-3xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <svg className="w-3 h-3 md:w-4 md:h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-0.5 md:mb-1">This Week</div>
            <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">{formatTime(weekTotal)}</div>
          </div>
        </div>

        {/* Charts - Enhanced Dark Style */}
        <div className="glass-dark p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-800/50">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-green-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">Weekly Sessions</h3>
              <p className="text-[10px] md:text-xs text-zinc-500">Sessions per day</p>
            </div>
          </div>
          {weeklyData && weeklyData.length > 0 ? (
            <div className="h-44 md:h-56">
              <canvas ref={barChartRef}></canvas>
            </div>
          ) : (
            <div className="h-44 md:h-56 flex flex-col items-center justify-center text-zinc-600">
              <svg className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs md:text-sm font-medium text-zinc-500">No data available yet</p>
              <p className="text-[10px] md:text-xs mt-1 text-zinc-600">Start a session to see your stats</p>
            </div>
          )}
        </div>

        <div className="glass-dark p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-800/50">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">Daily Minutes</h3>
              <p className="text-[10px] md:text-xs text-zinc-500">Time spent per day</p>
            </div>
          </div>
          {weeklyData && weeklyData.length > 0 ? (
            <div className="h-44 md:h-56">
              <canvas ref={lineChartRef}></canvas>
            </div>
          ) : (
            <div className="h-44 md:h-56 flex flex-col items-center justify-center text-zinc-600">
              <svg className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-xs md:text-sm font-medium text-zinc-500">No data available yet</p>
              <p className="text-[10px] md:text-xs mt-1 text-zinc-600">Start a session to see your progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}