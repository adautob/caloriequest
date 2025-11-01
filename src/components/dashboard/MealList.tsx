'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UtensilsCrossed, Trash2 } from 'lucide-react';
import AddMealDialog from "./AddMealDialog";
import { useUser, useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, where, Timestamp, doc } from "firebase/firestore";
import type { Meal } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { format, startOfDay, endOfDay } from 'date-fns';
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
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useDashboard } from "./DashboardProvider";


export default function MealList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { selectedDate } = useDashboard();

  const mealsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    return query(
        collection(firestore, `users/${user.uid}/meals`), 
        where('createdAt', '>=', start),
        where('createdAt', '<=', end),
        orderBy('createdAt', 'desc')
    );
  }, [user, firestore, selectedDate]);

  const { data: meals, isLoading } = useCollection<Meal>(mealsQuery);
  
  const getMealTime = (date: string) => {
    try {
        return format(new Date(date), "HH:mm");
    } catch(e) {
        // Fallback for old time format
        return date;
    }
  }

  const handleDeleteMeal = (mealId: string) => {
    if (!user || !firestore) return;
    const mealDocRef = doc(firestore, `users/${user.uid}/meals`, mealId);
    deleteDocumentNonBlocking(mealDocRef);
    toast({
        title: "Refeição Excluída",
        description: "A refeição foi removida do seu diário."
    })
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle className="font-headline">Refeições</CardTitle>
          <CardDescription>
            {meals ? `${meals.length} refeições registradas.` : 'Carregando...'}
          </CardDescription>
        </div>
        <AddMealDialog>
          <Button size="sm" className="ml-auto gap-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-4 w-4" />
            Adicionar
          </Button>
        </AddMealDialog>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><Skeleton className="h-10 w-full" /></div>
            <div className="flex items-center justify-between"><Skeleton className="h-10 w-full" /></div>
            <div className="flex items-center justify-between"><Skeleton className="h-10 w-full" /></div>
          </div>
        )}
        {!isLoading && meals && meals.length > 0 && (
          <div className="space-y-2">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted/80 transition-colors group">
                <div className="flex-grow">
                  <p className="font-semibold">{meal.name}</p>
                  <p className="text-sm text-muted-foreground">{getMealTime(meal.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">{meal.calories} kcal</p>
                  <p className="text-sm text-muted-foreground">
                    P:{meal.protein}g C:{meal.carbohydrates}g F:{meal.fat}g Fib:{meal.fiber || 0}g
                  </p>
                </div>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a refeição "{meal.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteMeal(meal.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
         {!isLoading && (!meals || meals.length === 0) && (
            <div className="text-center text-muted-foreground py-10">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm">Nenhuma refeição registrada neste dia.</p>
                <p className="text-xs">Clique em "Adicionar" para começar.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
