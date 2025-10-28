'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UtensilsCrossed } from 'lucide-react';
import AddMealDialog from "./AddMealDialog";
import { useUser, useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Meal } from "@/lib/types";
import { useMemo } from "react";
import { Skeleton } from "../ui/skeleton";

export default function MealList() {
  const { user } = useUser();
  const firestore = useFirestore();

  const mealsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/meals`), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: meals, isLoading } = useCollection<Meal>(mealsQuery as any);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle className="font-headline">Refeições do Dia</CardTitle>
          <CardDescription>
            {meals ? `${meals.length} refeições registradas hoje.` : 'Carregando...'}
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
          <div className="space-y-4">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted/80 transition-colors">
                <div>
                  <p className="font-semibold">{meal.name}</p>
                  <p className="text-sm text-muted-foreground">{meal.time}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">{meal.calories} kcal</p>
                  <p className="text-sm text-muted-foreground">
                    P:{meal.protein}g C:{meal.carbohydrates}g F:{meal.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
         {!isLoading && (!meals || meals.length === 0) && (
            <div className="text-center text-muted-foreground py-10">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm">Nenhuma refeição registrada ainda.</p>
                <p className="text-xs">Clique em "Adicionar" para começar.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}