"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import type { ChartPoint } from "@/types/database";

const palette = ["#8B5E3C", "#D4AF37", "#F8C8DC", "#A97855", "#5F3D29", "#E7B7C9"];

function EmptyChart() {
  return <div className="grid h-[260px] place-items-center rounded-xl border border-dashed border-stone-200 text-center text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">Sin datos disponibles. El modulo se llenara automaticamente desde Supabase.</div>;
}

export function VentasAreaChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card className="xl:col-span-2">
      <CardTitle>Ventas últimos 30 días</CardTitle>
      <div className="mt-5 h-[310px]">
        {data.some((point) => point.value > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F8C8DC" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#F8C8DC" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,94,60,.16)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#8B5E3C" strokeWidth={3} fill="url(#ventasGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  );
}

export function RankingChart({ title, data }: { title: string; data: ChartPoint[] }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-5 h-[260px]">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,94,60,.14)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={112} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5E3C" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  );
}

export function DonutChart({ title, data }: { title: string; data: ChartPoint[] }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-5 h-[260px]">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  );
}
