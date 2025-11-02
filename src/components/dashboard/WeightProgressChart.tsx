'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Dot } from 'recharts';
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { WeightMeasurement } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const chartConfig = {
  weight: {
    label: 'Peso (kg)',
    color: 'hsl(var(--accent))',
  },
};

const CustomTooltip = ({ active, payload, label, onDelete }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.isPlaceholder) return null;
        
        const date = new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        
        return (
            <div className="bg-popover text-popover-foreground rounded-lg border shadow-sm p-3 flex items-center gap-2">
                <div>
                    <p className="font-bold">{`${data.weight} kg`}</p>
                    <p className="text-sm text-muted-foreground">{date}</p>
                </div>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a medição de <strong>{data.weight}kg</strong> do dia <strong>{date}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(data.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
  const { toast } = useToast();

  const weightMeasurementsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/weightMeasurements`),
      orderBy('date', 'asc')
    );
  }, [user, firestore]);

  const { data: rawChartData, isLoading } = useCollection<WeightMeasurement>(weightMeasurementsQuery);

  const chartData = useMemo(() => {
    if (!rawChartData) {
        return [];
    }
    // Case 1: No data
    if (rawChartData.length === 0) {
        return [];
    }

    // Case 2: Only one measurement exists. We'll draw a flat line to today.
    if (rawChartData.length === 1) {
        const singleEntry = rawChartData[0];
        const singleEntryDate = new Date(singleEntry.date).toDateString();
        const todayDate = new Date().toDateString();

        // If the single entry is not today, add a placeholder for today to draw the line
        if (singleEntryDate !== todayDate) {
            return [
                singleEntry,
                { ...singleEntry, date: new Date().toISOString(), isPlaceholder: true },
            ];
        }
        // If it is from today, duplicate it to draw a point
        return [singleEntry, { ...singleEntry, isPlaceholder: true }];
    }

    // Case 3: There are multiple measurements, just return them as is
    return rawChartData;

  }, [rawChartData]);

  const handleDelete = (measurementId: string) => {
    if (!user || !firestore || !measurementId) return;
    const docRef = doc(firestore, `users/${user.uid}/weightMeasurements`, measurementId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Medição Excluída',
      description: 'O registro de peso foi removido do seu histórico.',
    });
  };
  
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
    <Card className="shadow-sm hover-shadow-md transition-shadow h-full">
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
              content={<CustomTooltip onDelete={handleDelete} />}
              wrapperStyle={{ outline: "none" }}
              allowAsyncContent
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
