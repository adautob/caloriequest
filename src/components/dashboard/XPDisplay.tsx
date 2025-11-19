'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { XP_PER_LEVEL } from "@/lib/game-mechanics";
import { Skeleton } from "../ui/skeleton";
import { Gem } from "lucide-react";

export default function XPDisplay() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  const level = userProfile?.level || 1;
  const xp = userProfile?.xp || 0;
  const progress = (xp / XP_PER_LEVEL) * 100;

  if (isLoading) {
    return (
      <Card className="shadow-sm lg:col-span-4">
        <CardHeader className="pb-2 flex-row items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32 mt-1" />
            </div>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-1/4 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-4">
      <CardHeader className="pb-2 flex-row items-center gap-4 space-y-0">
         <div className="p-3 rounded-full bg-primary/20 text-primary">
            <Gem className="h-6 w-6" />
         </div>
         <div>
            <CardDescription className="font-headline">Nível {level}</CardDescription>
            <CardTitle className="text-xl font-headline">
                {userProfile?.name || "Aventureiro"}
            </CardTitle>
         </div>
      </CardHeader>
      <CardContent>
        <Progress value={progress} aria-label={`${progress.toFixed(0)}% para o próximo nível`} className="h-3 bg-primary/20 [&>div]:bg-primary" />
        <p className="text-xs text-muted-foreground mt-2">
            {xp} / {XP_PER_LEVEL} XP para o próximo nível
        </p>
      </CardContent>
    </Card>
  );
}
