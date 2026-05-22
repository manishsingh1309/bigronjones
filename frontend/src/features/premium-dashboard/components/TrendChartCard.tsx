import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import SectionCard from "./SectionCard";
import type { Analytics } from "../types";

export default function TrendChartCard({
  analytics,
}: {
  analytics: Analytics;
}) {
  const chartData = analytics.labels.map((label, index) => ({
    label,
    energy: analytics.energy[index] ?? 0,
    mood: analytics.mood[index] ?? 0,
    performance: analytics.performance[index] ?? 0,
    consistency: analytics.checkInConsistency[index] ?? 0,
    weight: analytics.weight[index] ?? null,
  }));

  return (
    <SectionCard title="Analytics" eyebrow="Progress signals">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#2a2417] bg-black/35 p-4">
          <p className="mb-3 font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
            Energy / Mood / Performance
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2f2719" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#66593b" fontSize={10} />
                <YAxis stroke="#66593b" fontSize={10} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: "#090909",
                    border: "1px solid #2a2417",
                    borderRadius: 16,
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#f5d77b"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#ffffff"
                  strokeOpacity={0.7}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#c9a54f"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[#2a2417] bg-black/35 p-4">
          <p className="mb-3 font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
            Check-in Consistency / Weight
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#2f2719" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#66593b" fontSize={10} />
                <YAxis yAxisId="left" stroke="#66593b" fontSize={10} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#66593b"
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    background: "#090909",
                    border: "1px solid #2a2417",
                    borderRadius: 16,
                    color: "#fff",
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="consistency"
                  stroke="#f5d77b"
                  fill="#f5d77b"
                  fillOpacity={0.18}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="weight"
                  stroke="#ffffff"
                  strokeOpacity={0.8}
                  strokeWidth={2.2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
