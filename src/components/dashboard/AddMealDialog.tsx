'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import { useFormStatus } from "react-dom";
import { addMeal, AddMealState } from "@/app/actions";
import { useEffect, useState, useRef, useActionState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { collection, serverTimestamp, query, where, Timestamp } from "firebase/firestore";
import { UserAchievement } from "@/lib/types";

const initialState: AddMealState = {
  message: null,
  nutritionalInfo: null,
  errors: null,
  success: false,
  submissionId: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      Analisar e Salvar Refeição
    </Button>
  );
}

export default function AddMealDialog({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(addMeal, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [lastSuccessId, setLastSuccessId] = useState<string | null>(null);


  const userAchievementsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/userAchievements`);
  }, [user, firestore]);
  const { data: userAchievements } = useCollection<UserAchievement>(userAchievementsRef);

  const mealsTodayQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(todayStart);
    return query(collection(firestore, `users/${user.uid}/meals`), where("createdAt", ">=", todayTimestamp));
  }, [user, firestore]);
  const { data: mealsToday } = useCollection(mealsTodayQuery);


  useEffect(() => {
    if (!state || !user || !firestore || !userAchievementsRef) return;

    // Only process if it's a new, successful submission
    if (state.success && state.submissionId && state.submissionId !== lastSuccessId && state.nutritionalInfo) {
      setLastSuccessId(state.submissionId); // Mark this submission as processed

      // AI part was successful, now save to Firestore
      const mealsCollection = collection(firestore, `users/${user.uid}/meals`);
      
      addDocumentNonBlocking(mealsCollection, {
        ...state.nutritionalInfo,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: "Sucesso!",
        description: `"${state.nutritionalInfo.name}" adicionado com sucesso!`,
      });

      // Check for calorie-goal achievement
      const hasCalorieGoalAchievement = userAchievements?.some(ach => ach.achievementId === 'calorie-goal');
      if (!hasCalorieGoalAchievement) {
          const totalCaloriesToday = (mealsToday?.reduce((sum, meal) => sum + meal.calories, 0) || 0) + state.nutritionalInfo.calories;
          // You might need to fetch the user's dailyCalorieGoal here if it's not available
          // For now, let's assume a default or fetch it.
          // This logic should ideally be more robust, maybe fetching profile in a shared context.
          const dailyGoal = 2000; // Placeholder
          if (totalCaloriesToday >= dailyGoal) {
               addDocumentNonBlocking(userAchievementsRef, {
                  achievementId: 'calorie-goal',
                  dateEarned: serverTimestamp(),
              });
              toast({
                  title: "Conquista Desbloqueada!",
                  description: "Meta Calórica: Você atingiu sua meta diária de calorias.",
                  className: "bg-accent text-accent-foreground border-accent"
              });
          }
      }

      setIsOpen(false);
      formRef.current?.reset();

    } else if (state.message && !state.success && state.submissionId !== lastSuccessId) {
      setLastSuccessId(state.submissionId || null); // Mark as processed to avoid repeated toasts
      toast({
        title: "Erro ao adicionar refeição",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, user, firestore, toast, userAchievementsRef, userAchievements, mealsToday, lastSuccessId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Adicionar Refeição com IA</DialogTitle>
          <DialogDescription>
            Descreva o que você comeu (ex: 2 ovos fritos e 1 fatia de pão integral). A IA fará o resto.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="grid gap-4 py-4">
           <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="foodDescription">O que você comeu?</Label>
            <Textarea 
              id="foodDescription" 
              name="foodDescription" 
              placeholder="Ex: 1 xícara de café com leite e 2 pães na chapa" 
              required 
            />
            {state?.errors?.foodDescription && <p className="text-destructive text-sm mt-1">{state.errors.foodDescription[0]}</p>}
           </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
