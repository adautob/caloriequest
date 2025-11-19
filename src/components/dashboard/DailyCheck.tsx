'use client';

import { useEffect, useMemo } from 'react';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { startOfDay, subDays, endOfDay } from 'date-fns';
import { applyXpChange, XP_EVENTS } from '@/lib/game-mechanics';
import type { Meal, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * An invisible component that handles daily checks, like awarding XP for calorie goals.
 */
export default function DailyCheck() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const yesterdayStart = useMemo(() => startOfDay(subDays(new Date(), 1)), []);
  const yesterdayEnd = useMemo(() => endOfDay(subDays(new Date(), 1)), []);

  const yesterdayMealsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/meals`),
      where('createdAt', '>=', yesterdayStart),
      where('createdAt', '<=', yesterdayEnd)
    );
  }, [user, firestore, yesterdayStart, yesterdayEnd]);

  const { data: yesterdayMeals } = useCollection<Meal>(yesterdayMealsQuery);

  useEffect(() => {
    const performDailyCheck = async () => {
      if (!userProfile || !yesterdayMeals || !firestore || !userProfileRef) return;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const lastCheckStr = userProfile.lastDailyXpCheck;
      
      // Only run once per day
      if (lastCheckStr === todayStr) {
        return;
      }
      
      const calorieGoal = userProfile.dailyCalorieGoal || 0;
      if (calorieGoal <= 0) {
        // No goal set, so no XP change
         setDocumentNonBlocking(userProfileRef, { lastDailyXpCheck: todayStr }, { merge: true });
        return;
      }

      const totalCaloriesYesterday = yesterdayMeals.reduce((sum, meal) => sum + meal.calories, 0);

      let xpChange = 0;
      let toastTitle = '';
      let toastDescription = '';

      if (totalCaloriesYesterday > 0 && totalCaloriesYesterday <= calorieGoal) {
        xpChange = XP_EVENTS.MET_DAILY_CALORIE_GOAL;
        toastTitle = "Meta de Calorias Atingida!";
        toastDescription = `Você ganhou ${xpChange} XP por se manter na meta ontem!`;
      } else if (totalCaloriesYesterday > calorieGoal) {
        xpChange = XP_EVENTS.EXCEEDED_DAILY_CALORIE_GOAL;
        toastTitle = "Meta de Calorias Excedida";
        toastDescription = `Você perdeu ${Math.abs(xpChange)} XP por ultrapassar a meta ontem.`;
      } else {
        // No meals logged yesterday, do nothing
        setDocumentNonBlocking(userProfileRef, { lastDailyXpCheck: todayStr }, { merge: true });
        return;
      }
      
      try {
        const { levelledUp, newLevel } = await applyXpChange(firestore, userProfileRef, xpChange);
        toast({
          title: toastTitle,
          description: toastDescription,
          className: xpChange > 0 ? "bg-accent text-accent-foreground" : "border-destructive",
        });

        if (levelledUp) {
          toast({
            title: "Subiu de Nível!",
            description: `Parabéns, você alcançou o nível ${newLevel}!`,
            className: "bg-primary text-primary-foreground border-primary"
          });
        }

        // Mark today as checked
        setDocumentNonBlocking(userProfileRef, { lastDailyXpCheck: todayStr }, { merge: true });

      } catch (error) {
        console.error("Failed to apply daily XP change:", error);
      }
    };

    performDailyCheck();
  }, [userProfile, yesterdayMeals, firestore, userProfileRef, toast]);

  return null; // This component does not render anything
}
