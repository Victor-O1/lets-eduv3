"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import {
  fetchTotalStudyTime,
  fetchSubjectWiseTime,
  fetchDailyTrend,
} from "@/lib/db/analytics";

export default function DashboardPage() {
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState(0);
  const [month, setMonth] = useState(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setToday(await fetchTotalStudyTime("day"));
      setWeek(await fetchTotalStudyTime("week"));
      setMonth(await fetchTotalStudyTime("month"));
      setSubjects(await fetchSubjectWiseTime());
      setTrend(await fetchDailyTrend());
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-slate-700/50 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white/90 mb-1">
            Analytics
          </h1>
          <p className="text-slate-400 text-sm">Track your study progress</p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Today" value={today} />
          <StatCard label="This Week" value={week} />
          <StatCard label="This Month" value={month} />
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SUBJECT PIE */}
          <ChartCard title="Subject Distribution">
            <div className="flex justify-center items-center h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjects}
                    dataKey="seconds"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    animationBegin={0}
                    animationDuration={800}
                    paddingAngle={2}
                  >
                    {subjects.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(71, 85, 105, 0.3)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {subjects.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {subjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    ></div>
                    <span className="text-slate-400">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          {/* DAILY TREND */}
          <ChartCard title="Daily Trend">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <XAxis
                    dataKey="day"
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  />
                  <YAxis
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(71, 85, 105, 0.3)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="seconds"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ fill: "#6366F1", r: 3 }}
                    activeDot={{ r: 5 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* CONSISTENCY FULL WIDTH */}
        <ChartCard title="Consistency">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <XAxis
                  dataKey="day"
                  stroke="rgba(148, 163, 184, 0.3)"
                  tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                />
                <YAxis
                  stroke="rgba(148, 163, 184, 0.3)"
                  tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(71, 85, 105, 0.3)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar
                  dataKey="seconds"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700/50 transition-all">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="text-3xl font-semibold text-white/90">
        {(value / 3600).toFixed(1)}
        <span className="text-lg text-slate-400 ml-1">hrs</span>
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {(value / 60).toFixed(0)} minutes
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
      <h2 className="text-sm font-medium text-white/80 mb-4">{title}</h2>
      {children}
    </div>
  );
}
