'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Dot } from 'recharts';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { WeightMeasurement, UserProfile } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";

const chartConfig = {
  weight: {
    label: 'Peso (kg)',
    color: 'hsl(var(--accent))',
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        // Check if the data point is a placeholder, if so, don't show tooltip
        if (data.isPlaceholder) return null;
        
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
  const { cx, cy, stroke, fill, payload } = props;
  if (payload.isPlaceholder) return null;
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

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const weightMeasurementsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/weightMeasurements`),
      orderBy('date', 'asc')
    );
  }, [user, firestore]);

  const { data: rawChartData, isLoading: areMeasurementsLoading } = useCollection<WeightMeasurement>(weightMeasurementsQuery);

  const chartData = useMemo(() => {
    const today = new Date().toISOString();

    const measurements = rawChartData || [];
    
    // Base case: no data at all
    if (measurements.length === 0) {
      if (userProfile?.currentWeight) {
         // Create two points for today to draw a flat line
        const startPoint = { date: today, weight: userProfile.currentWeight };
        const endPoint = { ...startPoint, isPlaceholder: true };
        return [startPoint, endPoint];
      }
      return []; // Truly no data to show
    }

    // If there's only one measurement, we create a placeholder to draw a line to today
    if (measurements.length === 1) {
      const singleEntry = measurements[0];
      const singleEntryDate = new Date(singleEntry.date).toDateString();
      const todayDate = new Date().toDateString();
      
      // If the single entry is not from today, add a placeholder for today
      if (singleEntryDate !== todayDate) {
        return [
          singleEntry,
          { date: today, weight: singleEntry.weight, isPlaceholder: true },
        ];
      }
      // If it is from today, duplicate it to draw a point
      return [singleEntry, { ...singleEntry, isPlaceholder: true }];
    }
    
    // If there are multiple measurements, just return them
    return measurements;
  }, [rawChartData, userProfile]);

  const isLoading = isProfileLoading || areMeasurementsLoading;

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
  
  if (!chartData || chartData.length === 0) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
            <CardHeader>
                <CardTitle className="font-headline">Progresso de Peso</CardTitle>
                <CardDescription>Seu peso ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[250px] text-center">
                <p className="text-muted-foreground">Registre seu peso no seu perfil para começar a ver o progresso.</p>
            </CardContent>
        </Card>
    );
  }

  const yDomainMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) - 2 : 50;
  const yDomainMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) + 2 : 100;

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
              type="category"
              allowDuplicatedCategory={true}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tickMargin={8}
              domain={[yDomainMin, yDomainMax]}
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
              dot={(props) => {
                const { key, payload, ...rest } = props;
                if (payload.isPlaceholder) return null;
                return (<Dot key={key} {...rest} r={4} fill="var(--color-weight)" strokeWidth={2} stroke="hsl(var(--background))" />);
              }}
              activeDot={<CustomActiveDot />}
              strokeDasharray={chartData.length > 0 && chartData[chartData.length - 1].isPlaceholder ? "5 5" : "0"}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
