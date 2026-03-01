import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  logs: any[];
}

export function AttackChart({ logs }: Props) {
  const data = Object.values(
    logs.reduce((acc: any, log: any) => {
      if (!acc[log.attackType]) {
        acc[log.attackType] = {
          name: log.attackType,
          count: 0,
        };
      }
      acc[log.attackType].count++;
      return acc;
    }, {})
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
