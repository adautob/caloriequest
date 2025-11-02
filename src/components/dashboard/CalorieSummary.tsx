'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, Timestamp, doc } from "firebase/firestore";
import type { Meal, UserProfile } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { useDashboard } from "./DashboardProvider";
import { startOfDay, endOfDay } from 'date-fns';
import { cn } from "@/lib/utils";

const DEFAULT_CALORIE_GOAL = 2200;

export default function CalorieSummary() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { selectedDate } = useDashboard();
  const [totalCalories, setTotalCalories] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const calorieGoal = userProfile?.dailyCalorieGoal || DEFAULT_CALORIE_GOAL;

  const mealsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;

    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    return query(
      collection(firestore, `users/${user.uid}/meals`),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end)
    );
  }, [user, firestore, selectedDate]);

  const { data: meals, isLoading: areMealsLoading } = useCollection<Meal>(mealsQuery);

  useEffect(() => {
    if (meals) {
      const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
      setTotalCalories(calories);
      if (calorieGoal > 0) {
        setProgress(Math.min((calories / calorieGoal) * 100, 100));
      } else {
        setProgress(100); // If goal is 0, consider it met.
      }
    } else {
      setTotalCalories(0);
      setProgress(0);
    }
  }, [meals, calorieGoal]);

  const caloriesRemaining = Math.max(0, calorieGoal - totalCalories);
  const caloriesOver = totalCalories > calorieGoal ? totalCalories - calorieGoal : 0;

  if (areMealsLoading || isProfileLoading) {
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
        <CardDescription className="font-headline">Calorias</CardDescription>
        <CardTitle className={cn("text-4xl font-headline", totalCalories > calorieGoal && "text-orange-500")}>
          {totalCalories.toLocaleString()} / <span className="text-2xl text-muted-foreground">{calorieGoal.toLocaleString()} kcal</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} aria-label={`${progress.toFixed(0)}% da meta de calorias`} className="h-3 bg-primary/20 [&>div]:bg-accent" />
        <p className="text-xs text-muted-foreground mt-2">
            {caloriesOver > 0 
                ? <span className="font-medium text-orange-500">{caloriesOver.toLocaleString()} kcal acima da meta</span>
                : <span>{caloriesRemaining.toLocaleString()} calorias restantes</span>
            }
        </p>
      </CardContent>
    </Card>
  );
}
