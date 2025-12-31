'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'

export function Sparkline({ values }: { values: number[] }) {
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div className="h-8 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
