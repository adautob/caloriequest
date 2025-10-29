'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, Timestamp, doc } from "firebase/firestore";
import type { Meal, UserProfile } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

const DEFAULT_CALORIE_GOAL = 2200;

export default function CalorieSummary() {
  const { user } = useUser();
  const firestore = useFirestore();
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    return query(
      collection(firestore, `users/${user.uid}/meals`),
      where('createdAt', '>=', todayTimestamp)
    );
  }, [user, firestore]);

  const { data: meals, isLoading: areMealsLoading } = useCollection<Meal>(mealsQuery);

  useEffect(() => {
    if (meals) {
      const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
      setTotalCalories(calories);
      setProgress((calories / calorieGoal) * 100);
    }
  }, [meals, calorieGoal]);

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
        <CardDescription className="font-headline">Calorias de Hoje</CardDescription>
        <CardTitle className="text-4xl font-headline">
          {totalCalories.toLocaleString()} / <span className="text-2xl text-muted-foreground">{calorieGoal.toLocaleString()} kcal</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} aria-label={`${progress.toFixed(0)}% da meta de calorias`} className="h-3 bg-primary/20 [&>div]:bg-accent" />
        <p className="text-xs text-muted-foreground mt-2">{Math.max(0, calorieGoal - totalCalories).toLocaleString()} calorias restantes</p>
      </CardContent>
    </Card>
  );
}
