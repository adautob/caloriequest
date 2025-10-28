'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { weightHistory } from '@/lib/data';

const chartData = weightHistory;
const chartConfig = {
  weight: {
    label: 'Peso (kg)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export default function WeightProgressChart() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="font-headline">Progresso de Peso</CardTitle>
        <CardDescription>Seu peso ao longo do tempo.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: -10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tickMargin={8}
              domain={['dataMin - 2', 'dataMax + 2']}
              width={50}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="line" 
                labelFormatter={(value, payload) => `${payload?.[0]?.payload.weight} kg em ${new Date(value).toLocaleDateString('pt-BR')}`}
                />}
            />
            <Line
              dataKey="weight"
              type="monotone"
              stroke="var(--color-weight)"
              strokeWidth={3}
              dot={{
                fill: "var(--color-weight)",
                r: 4
              }}
              activeDot={{
                r: 8,
                className: "stroke-primary"
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
