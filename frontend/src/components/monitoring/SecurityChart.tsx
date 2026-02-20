import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Shield } from 'lucide-react';

interface SecurityChartProps {
  data: { hour: string; bruteForce: number; ddos: number; authFail: number }[];
}

export function SecurityChart({ data }: SecurityChartProps) {
  return (
    <div className="panel-card h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Shield className="w-5 h-5 text-emerald-500" />
        <h2 className="font-semibold">Security Events (24H)</h2>
      </div>

      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={1}>
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 25%, 13%)',
                border: '1px solid hsl(220, 20%, 22%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)',
              }}
              labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
            />
            <Legend 
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px' }}
            />
            <Bar dataKey="bruteForce" name="Brute Force" fill="#ef4444" radius={[2, 2, 0, 0]} />
            <Bar dataKey="ddos" name="DDoS" fill="#a855f7" radius={[2, 2, 0, 0]} />
            <Bar dataKey="authFail" name="Auth Failure" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
