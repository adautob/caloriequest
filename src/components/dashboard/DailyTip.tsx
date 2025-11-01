'use client';

import { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { fetchDailyTip } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, X } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";

export default function DailyTip() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [tip, setTip] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastTipDate = localStorage.getItem('lastTipDate');
        const isDismissed = localStorage.getItem(`tipDismissed_${today}`) === 'true';

        if (isDismissed) {
            setIsVisible(false);
            setIsLoading(false);
            return;
        }

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
                setIsVisible(true);
                localStorage.setItem('dailyTip', fetchedTip);
                localStorage.setItem('lastTipDate', today);
            } catch (error) {
                console.error("Failed to fetch daily tip", error);
                setTip("Não foi possível carregar a dica de hoje. Tente novamente mais tarde.");
                setIsVisible(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (lastTipDate === today) {
            const cachedTip = localStorage.getItem('dailyTip');
            if (cachedTip) {
                setTip(cachedTip);
                setIsVisible(true);
            } else {
                 getTip(); // Fetch if cache is missing for some reason
            }
            setIsLoading(false);
        } else if(userProfile) {
            getTip();
        } else if (!userProfile) {
            setIsLoading(false); // Stop loading if there's no profile to fetch a tip for
        }

    }, [userProfile]);

    const handleDismiss = () => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`tipDismissed_${today}`, 'true');
        setIsVisible(false);
    }

    if (isLoading) {
        return (
            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <Skeleton className="h-5 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (!tip || !isVisible) {
        return null;
    }

    return (
        <Card className="bg-primary/10 border-primary/20 shadow-sm hover:shadow-md transition-shadow relative group">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/20 rounded-full">
                    <Lightbulb className="h-5 w-5 text-primary-foreground/80" />
                </div>
                <p className="text-sm font-medium text-primary-foreground/90 pr-6">
                    {tip}
                </p>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-primary-foreground/50 hover:text-primary-foreground/80 hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDismiss}
                    aria-label="Fechar dica"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
