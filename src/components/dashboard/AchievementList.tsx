'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { UserAchievement } from "@/lib/types";
import { achievementIcons } from "@/lib/data";
import { allAchievements } from "@/lib/achievements";
import { Skeleton } from "../ui/skeleton";

export default function AchievementList() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userAchievementsQuery = useMemoFirebase(() => 
    user && firestore ? collection(firestore, `users/${user.uid}/userAchievements`) : null
  , [user, firestore]);

  const { data: userAchievements, isLoading: isLoadingUser } = useCollection<UserAchievement>(userAchievementsQuery);
  
  const isLoading = isLoadingUser;

  const unlockedAchievementIds = useMemoFirebase(() => 
    new Set(userAchievements?.map(a => a.achievementId))
  , [userAchievements]);

  if (isLoading) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="font-headline">Conquistas</CardTitle>
          <CardDescription>Suas medalhas e marcos.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-14 rounded-full" />
              ))}
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="font-headline">Conquistas</CardTitle>
        <CardDescription>Suas medalhas e marcos.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allAchievements.map((achievement) => {
              const Icon = achievementIcons[achievement.id] || achievementIcons.default;
              const isUnlocked = unlockedAchievementIds?.has(achievement.id);

              return (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-center p-3 rounded-full aspect-square transition-all duration-300 transform hover:scale-110",
                      isUnlocked ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground opacity-50'
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {!isUnlocked && <p className="text-xs text-muted-foreground italic mt-1">Bloqueada</p>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
