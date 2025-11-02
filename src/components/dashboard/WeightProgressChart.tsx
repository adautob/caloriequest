'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { WeightMeasurement } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const chartConfig = {
  weight: {
    label: 'Peso (kg)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const date = new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        
        const handleDelete = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!user || !firestore || !data.id) return;
            const docRef = doc(firestore, `users/${user.uid}/weightMeasurements`, data.id);
            deleteDocumentNonBlocking(docRef);
            toast({
                title: "Medição Excluída",
                description: `O registro de ${data.weight}kg foi removido.`,
            });
        };

        return (
            <div className="bg-popover text-popover-foreground rounded-lg border shadow-sm p-3 flex items-center gap-4">
                <div>
                    <p className="font-bold">{`${data.weight} kg`}</p>
                    <p className="text-sm text-muted-foreground">{date}</p>
                </div>

                <AlertDialog onOpenChange={(open) => !open && (document.body.style.pointerEvents = 'auto')}>
                    <AlertDialogTrigger asChild onMouseEnter={(e) => e.stopPropagation()}>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }
    return null;
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
              activeDot={{
                r: 8,
                stroke: 'hsl(var(--primary))',
                strokeWidth: 2,
                fill: 'hsl(var(--background))'
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
