"use client";

import { useEffect, useMemo, useState } from "react";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";

import { getSupabaseClient } from "@/lib/supabase";
import { Session, Subject } from "@/lib/types";

/* -------------------- Time helpers (timezone safe) -------------------- */

type TimeView = "today" | "week" | "month";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

function getRangeStart(view: TimeView) {
  if (view === "today") return startOfToday();
  if (view === "week") return startOfWeek();
  return startOfMonth();
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/* -------------------- Page -------------------- */

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeView, setTimeView] = useState<TimeView>("week");
  const [isLoading, setIsLoading] = useState(true);

  /* -------------------- Load raw data -------------------- */

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const from = new Date();
      from.setDate(from.getDate() - 90);

      const [{ data: sessionsData }, { data: subjectsData }] =
        await Promise.all([
          supabase
            .from("sessions")
            .select("*")
            .gte("start_time", from.toISOString()),
          supabase.from("subjects").select("*"),
        ]);

      setSessions(sessionsData ?? []);
      setSubjects(subjectsData ?? []);
      setIsLoading(false);
    }

    load();
  }, []);

  /* -------------------- Aggregations -------------------- */

  const totalSeconds = useMemo(() => {
    const from = getRangeStart(timeView);
    let seconds = 0;

    for (const s of sessions) {
      const start = new Date(s.start_time);
      if (start < from) continue;

      const end = s.end_time ? new Date(s.end_time) : new Date();
      seconds += Math.max(0, (end.getTime() - start.getTime()) / 1000);
    }

    return Math.floor(seconds);
  }, [sessions, timeView]);

  // Calculate totals for all time periods
  const [todayTotal, weekTotal, monthTotal] = useMemo(() => {
    const today = startOfToday();
    const week = startOfWeek();
    const month = startOfMonth();

    let todaySum = 0,
      weekSum = 0,
      monthSum = 0;

    for (const s of sessions) {
      const start = new Date(s.start_time);
      const end = s.end_time ? new Date(s.end_time) : new Date();
      const duration = Math.max(0, (end.getTime() - start.getTime()) / 1000);

      if (start >= today) todaySum += duration;
      if (start >= week) weekSum += duration;
      if (start >= month) monthSum += duration;
    }

    return [Math.floor(todaySum), Math.floor(weekSum), Math.floor(monthSum)];
  }, [sessions]);

  const subjectBars = useMemo(() => {
    const from = getRangeStart(timeView);
    const map: Record<string, number> = {};

    for (const s of sessions) {
      if (!s.subject_id) continue;

      const start = new Date(s.start_time);
      if (start < from) continue;

      const end = s.end_time ? new Date(s.end_time) : new Date();
      map[s.subject_id] =
        (map[s.subject_id] || 0) + (end.getTime() - start.getTime()) / 1000;
    }

    return subjects
      .map((sub) => ({
        name: sub.name,
        seconds: Math.floor(map[sub.id] || 0),
        hours: Number(((map[sub.id] || 0) / 3600).toFixed(1)),
        color: sub.color,
      }))
      .filter((s) => s.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds);
  }, [sessions, subjects, timeView]);

  const dailyTrend = useMemo(() => {
    const map: Record<string, number> = {};

    for (const s of sessions) {
      const start = new Date(s.start_time);
      const key = start.toLocaleDateString("en-CA");

      const end = s.end_time ? new Date(s.end_time) : new Date();
      map[key] = (map[key] || 0) + (end.getTime() - start.getTime()) / 1000;
    }

    return Object.entries(map)
      .map(([day, seconds]) => ({
        day: new Date(day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        seconds: Math.floor(seconds),
        hours: Number((seconds / 3600).toFixed(1)),
      }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14);
  }, [sessions]);

  const heatmap = useMemo(() => {
    const map: Record<string, number> = {};

    for (const s of sessions) {
      const start = new Date(s.start_time);
      const key = start.toLocaleDateString("en-CA");
      const end = s.end_time ? new Date(s.end_time) : new Date();

      map[key] = (map[key] || 0) + (end.getTime() - start.getTime()) / 1000;
    }

    return map;
  }, [sessions]);

  // Weekly pattern (hourly distribution)
  const weeklyPattern = useMemo(() => {
    const hourMap: Record<number, number> = {};

    for (const s of sessions) {
      const start = new Date(s.start_time);
      const hour = start.getHours();
      const end = s.end_time ? new Date(s.end_time) : new Date();

      hourMap[hour] =
        (hourMap[hour] || 0) + (end.getTime() - start.getTime()) / 1000;
    }

    return Array.from({ length: 24 }, (_, i) => ({
      hour:
        i === 0
          ? "12AM"
          : i < 12
          ? `${i}AM`
          : i === 12
          ? "12PM"
          : `${i - 12}PM`,
      seconds: Math.floor(hourMap[i] || 0),
      hours: Number(((hourMap[i] || 0) / 3600).toFixed(1)),
    })).filter((d) => d.seconds > 0);
  }, [sessions]);

  // Study streak
  const studyStreak = useMemo(() => {
    const dates = Object.keys(heatmap).sort().reverse();
    let streak = 0;
    const today = new Date().toLocaleDateString("en-CA");

    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toLocaleDateString("en-CA");

      if (dates[i] === expected && heatmap[dates[i]] > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [heatmap]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-slate-700/50 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  /* -------------------- Render -------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white/90 mb-1">
              Study Analytics
            </h1>
            <p className="text-slate-400 text-sm">
              Comprehensive overview of your learning journey
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 bg-slate-900/40 backdrop-blur-sm rounded-xl p-1 border border-slate-800/50">
            {(["today", "week", "month"] as TimeView[]).map((v) => (
              <button
                key={v}
                onClick={() => setTimeView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeView === v
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today"
            value={todayTotal}
            icon="📅"
            trend={todayTotal > 0 ? "+100%" : "0%"}
          />
          <StatCard
            label="This Week"
            value={weekTotal}
            icon="📊"
            trend={
              weekTotal > todayTotal
                ? `+${Math.floor((weekTotal / todayTotal - 1) * 100)}%`
                : "0%"
            }
          />
          <StatCard
            label="This Month"
            value={monthTotal}
            icon="📈"
            trend={
              monthTotal > weekTotal
                ? `+${Math.floor((monthTotal / weekTotal - 1) * 100)}%`
                : "0%"
            }
          />
          <StatCard
            label="Current Streak"
            value={studyStreak}
            icon="🔥"
            isStreak
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Subject Distribution - Donut */}
          <ChartCard
            title="Subject Distribution"
            subtitle={`Total: ${formatTime(totalSeconds)}`}
          >
            <div className="flex flex-col justify-center items-center h-80">
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={subjectBars}
                    dataKey="seconds"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    animationBegin={0}
                    animationDuration={800}
                    paddingAngle={3}
                    label={({ percent }) =>
                      percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                    }
                  >
                    {subjectBars.map((s, i) => (
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
                    formatter={(value: any) => formatTime(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              {subjectBars.length > 0 && (
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {subjectBars.slice(0, 6).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      ></div>
                      <span className="text-slate-400 truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ChartCard>

          {/* Daily Trend - Area Chart */}
          <ChartCard
            title="14-Day Trend"
            subtitle="Study hours over time"
            className="lg:col-span-2"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  />
                  <YAxis
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 11 }}
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
                    formatter={(value: any) => [
                      `${formatTime(value)}`,
                      "Study Time",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="seconds"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="url(#colorHours)"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Subject Comparison - Bar */}
          <ChartCard
            title="Subject Comparison"
            subtitle={`${
              timeView.charAt(0).toUpperCase() + timeView.slice(1)
            }'s breakdown`}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectBars} layout="vertical">
                  <XAxis
                    type="number"
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(71, 85, 105, 0.3)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(value: any) => formatTime(value)}
                  />
                  <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
                    {subjectBars.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Study Pattern - Line */}
          <ChartCard title="Time of Day Pattern" subtitle="When you study most">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyPattern}>
                  <XAxis
                    dataKey="hour"
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="rgba(148, 163, 184, 0.3)"
                    tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 11 }}
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
                    formatter={(value: any) => formatTime(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="seconds"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: "#10B981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Heatmap */}
        <ChartCard
          title="30-Day Consistency Heatmap"
          subtitle="Your daily study streak"
        >
          <div className="flex flex-wrap gap-2 p-4">
            {Array.from({ length: 30 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              const key = d.toLocaleDateString("en-CA");
              const v = heatmap[key] || 0;

              const color =
                v > 4 * 3600
                  ? "bg-indigo-600"
                  : v > 2 * 3600
                  ? "bg-indigo-500"
                  : v > 1 * 3600
                  ? "bg-indigo-400"
                  : v > 0
                  ? "bg-indigo-300/50"
                  : "bg-slate-800/50";

              return (
                <div
                  key={key}
                  title={`${d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}: ${formatTime(v)}`}
                  className={`w-10 h-10 rounded-lg ${color} transition-all hover:scale-110 hover:shadow-lg cursor-pointer flex items-center justify-center text-[10px] text-white/70 font-medium`}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-800/50"></div>
              No activity
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-400"></div>
              1-2 hrs
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-500"></div>
              2-4 hrs
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-600"></div>
              4+ hrs
            </span>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* -------------------- Small components -------------------- */

function StatCard({
  label,
  value,
  icon,
  trend,
  isStreak = false,
}: {
  label: string;
  value: number;
  icon: string;
  trend?: string;
  isStreak?: boolean;
}) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700/50 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-semibold text-white/90">
        {isStreak ? value : (value / 3600).toFixed(1)}
        <span className="text-lg text-slate-400 ml-1">
          {isStreak ? "days" : "hrs"}
        </span>
      </div>
      {!isStreak && (
        <div className="text-xs text-slate-500 mt-1">
          {(value / 60).toFixed(0)} minutes
        </div>
      )}
      {trend && !isStreak && (
        <div className="text-xs text-emerald-400 mt-2">{trend} vs previous</div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-sm font-medium text-white/80">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
