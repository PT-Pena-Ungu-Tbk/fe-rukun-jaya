"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatRupiah } from "@/lib/utils";

interface DashboardChartProps {
  data: any[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis dataKey="hari" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${v / 1000000}jt`} />
        <Tooltip formatter={(v: number) => formatRupiah(v)} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="nilai" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: "#3B82F6" }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
      </LineChart>
    </ResponsiveContainer>
  );
}
