import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DailyData {
  date: string;
  revenue: number;
  orderCount: number;
}

interface SalesChartProps {
  data: DailyData[];
  type?: "revenue" | "orders";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function formatCurrency(value: number) {
  return `$${value.toFixed(0)}`;
}

export default function SalesChart({ data, type = "revenue" }: SalesChartProps) {
  const color = type === "revenue" ? "#D4A03C" : "#5BA4CF";
  const label = type === "revenue" ? "Revenue" : "Orders";

  return (
    <div className="bg-[#243656] rounded-xl p-4">
      <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3">{label} (Last 30 Days)</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "#8A94A6", fontSize: 10 }}
              axisLine={{ stroke: "#1B2A4A" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#8A94A6", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={type === "revenue" ? formatCurrency : (v) => String(v)}
            />
            <Tooltip
              contentStyle={{
                background: "#1B2A4A",
                border: "1px solid #243656",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(val) => formatDate(val as string)}
              formatter={(value: number) => [type === "revenue" ? `$${value.toFixed(2)}` : value, label]}
            />
            <Bar dataKey={type} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
