'use client';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getGoalProjection } from '@/app/actions';
import { Loader2, Wand2 } from 'lucide-react';
import { useEffect, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';

const initialState = {
  message: null,
  data: null,
  errors: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all transform hover:scale-105 active:scale-100">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Calcular Projeção
    </Button>
  );
}

export default function GoalProjection() {
  const [state, formAction] = useActionState(getGoalProjection, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && (state.errors || (!state.data && !state.errors))) {
      toast({
        title: "Erro na Projeção",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast]);

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="font-headline">Projeção de Meta com IA</CardTitle>
        <CardDescription>
          Preencha seus dados para a IA calcular sua jornada e dar dicas.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
              <Input id="currentWeight" name="currentWeight" type="number" step="0.1" required defaultValue="85" />
              {state.errors?.currentWeight && <p className="text-destructive text-sm mt-1">{state.errors.currentWeight[0]}</p>}
            </div>
            <div>
              <Label htmlFor="goalWeight">Meta de Peso (kg)</Label>
              <Input id="goalWeight" name="goalWeight" type="number" step="0.1" required defaultValue="75" />
              {state.errors?.goalWeight && <p className="text-destructive text-sm mt-1">{state.errors.goalWeight[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input id="height" name="height" type="number" required defaultValue="180"/>
               {state.errors?.height && <p className="text-destructive text-sm mt-1">{state.errors.height[0]}</p>}
            </div>
            <div>
              <Label htmlFor="age">Idade</Label>
              <Input id="age" name="age" type="number" required defaultValue="30"/>
              {state.errors?.age && <p className="text-destructive text-sm mt-1">{state.errors.age[0]}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="gender">Gênero</Label>
            <Select name="gender" defaultValue="male" required>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="activityLevel">Nível de Atividade</Label>
            <Select name="activityLevel" defaultValue="lightly active" required>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentário</SelectItem>
                <SelectItem value="lightly active">Levemente Ativo</SelectItem>
                <SelectItem value="moderately active">Moderadamente Ativo</SelectItem>
                <SelectItem value="very active">Muito Ativo</SelectItem>
                <SelectItem value="extra active">Extremamente Ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="weeklyCalorieDeficit">Déficit Calórico Semanal</Label>
            <Input id="weeklyCalorieDeficit" name="weeklyCalorieDeficit" type="number" defaultValue="3500" required />
            {state.errors?.weeklyCalorieDeficit && <p className="text-destructive text-sm mt-1">{state.errors.weeklyCalorieDeficit[0]}</p>}
          </div>
          <div>
            <Label htmlFor="dietaryPreferences">Preferências Alimentares</Label>
            <Textarea id="dietaryPreferences" name="dietaryPreferences" placeholder="Ex: Vegetariano, baixo carboidrato..." required defaultValue="Sem restrições"/>
            {state.errors?.dietaryPreferences && <p className="text-destructive text-sm mt-1">{state.errors.dietaryPreferences[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 bg-muted/30 pt-4">
          <SubmitButton />
          {state.data && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 w-full space-y-3 animate-in fade-in-50 duration-500">
              <h3 className="font-headline text-lg font-semibold text-primary-foreground/90">Sua Projeção ✨</h3>
              <p>
                Você pode atingir sua meta em aproximadamente <span className="font-bold text-accent">{state.data.projectedTimelineWeeks} semanas</span>.
              </p>
              <h4 className="font-semibold pt-2">Dicas Personalizadas:</h4>
              <p className="text-sm whitespace-pre-wrap">{state.data.personalizedTips}</p>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
