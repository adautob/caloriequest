'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Meal } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

const CALORIE_GOAL = 2200;

export default function CalorieSummary() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [totalCalories, setTotalCalories] = useState(0);
  const [progress, setProgress] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mealsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    return query(
        collection(firestore, `users/${user.uid}/meals`)
        // This query won't work as expected without a composite index or same-property range filter.
        // For simplicity, we filter on the client. For production, create a 'date' field (YYYY-MM-DD).
    );
  }, [user, firestore]);

  const { data: meals, isLoading } = useCollection<Meal>(mealsQuery as any);

  useEffect(() => {
    if (meals) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const calories = meals
        .filter(meal => meal.createdAt?.toDate() > todayStart)
        .reduce((sum, meal) => sum + meal.calories, 0);
      setTotalCalories(calories);
      setProgress((calories / CALORIE_GOAL) * 100);
    }
  }, [meals]);

  if (isLoading) {
    return (
       <Card className="lg:col-span-2 shadow-sm">
        <CardHeader className="pb-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-1/2 mt-1" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-1/4 mt-2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardDescription className="font-headline">Calorias de Hoje</CardDescription>
        <CardTitle className="text-4xl font-headline">
          {totalCalories.toLocaleString()} / <span className="text-2xl text-muted-foreground">{CALORIE_GOAL.toLocaleString()} kcal</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} aria-label={`${progress.toFixed(0)}% da meta de calorias`} className="h-3 bg-primary/20 [&>div]:bg-accent" />
        <p className="text-xs text-muted-foreground mt-2">{Math.max(0, CALORIE_GOAL - totalCalories).toLocaleString()} calorias restantes</p>
      </CardContent>
    </Card>
  );
}