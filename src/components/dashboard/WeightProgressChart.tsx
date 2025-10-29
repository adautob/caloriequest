'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { WeightMeasurement } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  weight: {
    label: 'Peso (kg)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export default function WeightProgressChart() {
  const { user } = useUser();
  const firestore = useFirestore();

  const weightMeasurementsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/weightMeasurements`),
      orderBy('date', 'asc')
    );
  }, [user, firestore]);

  const { data: chartData, isLoading } = useCollection<WeightMeasurement>(weightMeasurementsQuery);

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }
  
  if (!chartData || chartData.length < 2) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
            <CardHeader>
                <CardTitle className="font-headline">Progresso de Peso</CardTitle>
                <CardDescription>Seu peso ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[250px] text-center">
                <p className="text-muted-foreground">Registre pelo menos duas medições de peso para ver seu progresso.</p>
                <p className="text-xs text-muted-foreground mt-1">Você pode registrar seu peso na página de Perfil.</p>
            </CardContent>
        </Card>
    );
  }

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
              dataKey="weight"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="line" 
                labelFormatter={(value, payload) => {
                    const date = new Date(value);
                    const weight = payload?.[0]?.payload.weight;
                    if (!isNaN(date.getTime()) && weight) {
                         return `${weight} kg em ${date.toLocaleDateString('pt-BR')}`;
                    }
                    return ""
                }}
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
