'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { dailyMeals } from '@/lib/data';
import { useEffect, useState } from "react";

const CALORIE_GOAL = 2000;

export default function CalorieSummary() {
  const [totalCalories, setTotalCalories] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calories = dailyMeals.reduce((sum, meal) => sum + meal.calories, 0);
    setTotalCalories(calories);
    setProgress((calories / CALORIE_GOAL) * 100);
  }, []);

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
