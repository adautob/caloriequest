'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import type { Meal } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { useDashboard } from "./DashboardProvider";
import { endOfDay, startOfDay } from "date-fns";

// Recommended daily goals in grams
const GOALS = {
  protein: 165,
  carbohydrates: 220,
  fat: 73,
  fiber: 30, // Goal for fiber
};

export default function MacronutrientSummary() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { selectedDate } = useDashboard();
  
  const [totals, setTotals] = useState({ protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
  const [percentages, setPercentages] = useState({ protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });

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

  const { data: meals, isLoading } = useCollection<Meal>(mealsQuery);

  useEffect(() => {
    if (meals) {
      const newTotals = meals.reduce((acc, meal) => {
        acc.protein += meal.protein || 0;
        acc.carbohydrates += meal.carbohydrates || 0;
        acc.fat += meal.fat || 0;
        acc.fiber += meal.fiber || 0;
        return acc;
      }, { protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
      setTotals(newTotals);

      const totalMacros = newTotals.protein + newTotals.carbohydrates + newTotals.fat + newTotals.fiber;
      if (totalMacros > 0) {
        setPercentages({
          protein: (newTotals.protein / totalMacros) * 100,
          carbohydrates: (newTotals.carbohydrates / totalMacros) * 100,
          fat: (newTotals.fat / totalMacros) * 100,
          fiber: (newTotals.fiber / totalMacros) * 100,
        });
      } else {
        setPercentages({ protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
      }
    } else {
        setTotals({ protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
        setPercentages({ protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
    }
  }, [meals]);

  if (isLoading) {
    return (
       <Card className="lg:col-span-2 shadow-sm">
        <CardHeader className="pb-2">
            <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="font-headline">Macros</CardTitle>
        <CardDescription>Resumo de proteínas, carboidratos, gorduras e fibras.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1 text-sm font-medium">
            <span className="text-pink-500">Proteína</span>
            <span className="text-muted-foreground">{totals.protein.toFixed(0)}g / {GOALS.protein}g</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-pink-500 h-2.5 rounded-full" style={{ width: `${(totals.protein / GOALS.protein) * 100}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-sm font-medium">
            <span className="text-blue-500">Carboidratos</span>
            <span className="text-muted-foreground">{totals.carbohydrates.toFixed(0)}g / {GOALS.carbohydrates}g</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(totals.carbohydrates / GOALS.carbohydrates) * 100}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-sm font-medium">
            <span className="text-yellow-500">Gordura</span>
            <span className="text-muted-foreground">{totals.fat.toFixed(0)}g / {GOALS.fat}g</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${(totals.fat / GOALS.fat) * 100}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-sm font-medium">
            <span className="text-green-500">Fibras</span>
            <span className="text-muted-foreground">{totals.fiber.toFixed(0)}g / {GOALS.fiber}g</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(totals.fiber / GOALS.fiber) * 100}%` }}></div>
          </div>
        </div>

        <div className="flex pt-4">
            <div className="flex items-center justify-center w-full">
                <div style={{width: `${percentages.protein}%`}} className="bg-pink-500 text-center py-1 text-xs font-bold text-white rounded-l-full">
                    {percentages.protein > 5 ? `${percentages.protein.toFixed(0)}%` : ''}
                </div>
                <div style={{width: `${percentages.carbohydrates}%`}} className="bg-blue-500 text-center py-1 text-xs font-bold text-white">
                    {percentages.carbohydrates > 5 ? `${percentages.carbohydrates.toFixed(0)}%` : ''}
                </div>
                <div style={{width: `${percentages.fat}%`}} className="bg-yellow-500 text-center py-1 text-xs font-bold text-white">
                    {percentages.fat > 5 ? `${percentages.fat.toFixed(0)}%` : ''}
                </div>
                 <div style={{width: `${percentages.fiber}%`}} className="bg-green-500 text-center py-1 text-xs font-bold text-white rounded-r-full">
                    {percentages.fiber > 5 ? `${percentages.fiber.toFixed(0)}%` : ''}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

    