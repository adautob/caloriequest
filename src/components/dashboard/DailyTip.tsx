'use client';

import { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { fetchDailyTip } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function DailyTip() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [tip, setTip] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastTipDate = localStorage.getItem('lastTipDate');
        
        const getTip = async () => {
            if (!userProfile) return;
            setIsLoading(true);
            try {
                const fetchedTip = await fetchDailyTip({
                    name: userProfile.name,
                    currentWeight: userProfile.currentWeight,
                    goalWeight: userProfile.weightGoal,
                    activityLevel: userProfile.activityLevel,
                    dietaryPreferences: userProfile.dietaryPreferences,
                });
                setTip(fetchedTip);
                localStorage.setItem('dailyTip', fetchedTip);
                localStorage.setItem('lastTipDate', today);
            } catch (error) {
                console.error("Failed to fetch daily tip", error);
                setTip("Não foi possível carregar a dica de hoje. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };

        if (lastTipDate === today) {
            setTip(localStorage.getItem('dailyTip'));
            setIsLoading(false);
        } else if(userProfile) {
            getTip();
        }
    }, [userProfile]);

    if (isLoading) {
        return (
            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <Skeleton className="h-5 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (!tip) {
        return null;
    }

    return (
        <Card className="bg-primary/10 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/20 rounded-full">
                    <Lightbulb className="h-5 w-5 text-primary-foreground/80" />
                </div>
                <p className="text-sm font-medium text-primary-foreground/90">
                    {tip}
                </p>
            </CardContent>
        </Card>
    );
}
