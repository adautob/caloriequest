'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Dot } from 'recharts';
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { WeightMeasurement } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  weight: {
    label: 'Peso (kg)',
    color: 'hsl(var(--accent))',
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const date = new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        
        return (
            <div className="bg-popover text-popover-foreground rounded-lg border shadow-sm p-3">
                <div>
                    <p className="font-bold">{`${data.weight} kg`}</p>
                    <p className="text-sm text-muted-foreground">{date}</p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomActiveDot = (props: any) => {
  const { cx, cy, stroke, fill } = props;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={8}
      stroke={stroke}
      fill={fill}
      strokeWidth={2}
      className="transition-transform duration-200 ease-in-out transform scale-110"
    />
  );
};


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
            <RechartsTooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={<CustomTooltip />}
              wrapperStyle={{ outline: "none" }}
            />
            <Line
              dataKey="weight"
              type="monotone"
              stroke="var(--color-weight)"
              strokeWidth={3}
              dot={{
                fill: "var(--color-weight)",
                r: 4,
                strokeWidth: 2,
                stroke: 'hsl(var(--background))'
              }}
              activeDot={<CustomActiveDot />}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
