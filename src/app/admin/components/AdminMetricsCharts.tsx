"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminPanel } from "./AdminCommandCenterShell";

type DailyPoint = { date: string; count: number };
type StatePoint = { state: string; count: number };

type AdminMetricsChartsProps = {
  geminiConsumption: DailyPoint[];
  geminiSource: string;
  userGrowth: DailyPoint[];
  schoolsByState: StatePoint[];
};

function shortDate(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

const chartTooltipStyle = {
  contentStyle: {
    background: "#0f1624",
    border: "1px solid rgba(51, 65, 85, 0.8)",
    borderRadius: "8px",
    fontSize: "12px",
  },
  labelStyle: { color: "#94a3b8" },
  itemStyle: { color: "#e2e8f0" },
};

export function AdminMetricsCharts({
  geminiConsumption,
  geminiSource,
  userGrowth,
  schoolsByState,
}: AdminMetricsChartsProps) {
  const geminiData = geminiConsumption.map((point) => ({
    ...point,
    label: shortDate(point.date),
  }));

  const growthData = userGrowth.map((point) => ({
    ...point,
    label: shortDate(point.date),
  }));

  const stateData = schoolsByState.slice(0, 12);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <AdminPanel title="Consumo Gemini API" subtitle={geminiSource}>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={geminiData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} width={32} />
              <Tooltip {...chartTooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                name="Gerações"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AdminPanel>

      <AdminPanel title="Crescimento de usuários" subtitle="profiles.created_at · 90 dias">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} width={32} />
              <Tooltip {...chartTooltipStyle} />
              <Area
                type="monotone"
                dataKey="count"
                name="Novos perfis"
                stroke="#a78bfa"
                fill="url(#userGrowthFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Escolas por UF"
        subtitle="schools.state · top 12"
        className="xl:col-span-2"
      >
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stateData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="state"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                width={36}
              />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" name="Escolas" fill="#34d399" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminPanel>
    </div>
  );
}
