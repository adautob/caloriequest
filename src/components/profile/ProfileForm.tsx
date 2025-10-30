'use client';

import { useEffect, useState, useRef, useTransition, useActionState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save, Wand2, Check, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { getGoalProjection, GoalProjectionState, updateProfile, UpdateProfileState } from '@/app/actions';
import type { UserProfile, UserAchievement } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const goalProjectionFormSchema = z.object({
  currentWeight: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({ required_error: 'Peso atual é obrigatório.' }).min(30, 'Peso deve ser no mínimo 30kg.')
  ),
  goalWeight: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({ required_error: 'Meta de peso é obrigatória.' }).min(30, 'Meta de peso deve ser no mínimo 30kg.')
  ),
  height: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({ required_error: 'Altura é obrigatória.' }).min(100, 'Altura deve ser no mínimo 100cm.')
  ),
  age: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({ required_error: 'Idade é obrigatória.' }).min(13, 'Você deve ter pelo menos 13 anos.')
  ),
  gender: z.string({ required_error: 'Gênero é obrigatório.' }).min(1, 'Gênero é obrigatório.'),
  activityLevel: z.string({ required_error: 'Nível de atividade é obrigatório.' }).min(1, 'Nível de atividade é obrigatório.'),
  goalTimelineWeeks: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({ required_error: 'O tempo para atingir a meta é obrigatório.' }).min(1, 'O tempo para atingir a meta deve ser de pelo menos 1 semana.')
  ),
  dietaryPreferences: z.string().optional(),
}).refine(data => {
    if (data.currentWeight === undefined || data.goalWeight === undefined) return true;
    return data.currentWeight > data.goalWeight;
}, {
  message: "O peso atual deve ser maior que a meta de peso.",
  path: ["goalWeight"],
});


const profileFormSchema = z.object({
  uid: z.string(),
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  currentWeight: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number({invalid_type_error: "Peso inválido"}).optional()
  ),
  height: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number({invalid_type_error: "Altura inválida"}).optional()
  ),
  weightGoal: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number({invalid_type_error: "Meta de peso inválida"}).optional()
  ),
  age: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number({invalid_type_error: "Idade inválida"}).optional()
  ),
  gender: z.string().optional(),
  activityLevel: z.string().optional(),
  dietaryPreferences: z.string().optional(),
  dailyCalorieGoal: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number({invalid_type_error: "Meta de calorias inválida"}).optional()
  ),
});


const initialProjectionState: GoalProjectionState = {
  message: null,
  data: null,
  errors: null,
};

const initialProfileState: UpdateProfileState = {
    message: '',
    success: false,
};

function ProjectionSubmitButton() {
  const { pending } = useFormStatus();
  return (
     <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Calcular Projeção com IA
    </Button>
  );
}

function calculateBmi(weight: number | undefined, height: number | undefined): number | null {
    if (!weight || !height || height === 0) return null;
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

function getBmiCategory(bmi: number | null): { category: string; color: string } {
    if (bmi === null) return { category: "N/A", color: "text-muted-foreground" };
    if (bmi < 18.5) return { category: "Abaixo do peso", color: "text-blue-500" };
    if (bmi < 25) return { category: "Peso normal", color: "text-green-500" };
    if (bmi < 30) return { category: "Sobrepeso", color: "text-yellow-500" };
    if (bmi < 35) return { category: "Obesidade Grau I", color: "text-orange-500" };
    if (bmi < 40) return { category: "Obesidade Grau II", color: "text-red-500" };
    return { category: "Obesidade Grau III", color: "text-red-700" };
}

export default function ProfileForm() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const weightFormRef = useRef<HTMLFormElement>(null);
    
    const [projectionState, projectionAction] = useActionState(getGoalProjection, initialProjectionState);
    const [profileState, profileAction] = useActionState(updateProfile, initialProfileState);


    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);
    
    const userAchievementsRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/userAchievements`);
    }, [user, firestore]);
    
    const { data: userAchievements } = useCollection<UserAchievement>(userAchievementsRef);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const formValues = useMemo(() => ({
        uid: user?.uid || '',
        name: userProfile?.name || user?.displayName || '',
        currentWeight: userProfile?.currentWeight,
        height: userProfile?.height,
        weightGoal: userProfile?.weightGoal,
        dailyCalorieGoal: userProfile?.dailyCalorieGoal,
        age: userProfile?.age,
        gender: userProfile?.gender || '',
        activityLevel: userProfile?.activityLevel || '',
        dietaryPreferences: userProfile?.dietaryPreferences || '',
    }), [userProfile, user]);

    const form = useForm<z.infer<typeof profileFormSchema>>({
      resolver: zodResolver(profileFormSchema),
      values: formValues, // Use values to keep form in sync with userProfile
    });

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    
    const bmi = calculateBmi(form.watch('currentWeight'), form.watch('height'));
    const bmiCategory = getBmiCategory(bmi);
    const dailyCalorieGoal = form.watch('dailyCalorieGoal');
    
    useEffect(() => {
        if (profileState.message) {
            if (profileState.success) {
                toast({
                    title: "Sucesso!",
                    description: profileState.message,
                });
                if (userAchievementsRef) {
                    const hasFirstLogAchievement = userAchievements?.some(ach => ach.achievementId === 'first-log');
                    if (!hasFirstLogAchievement) {
                        addDocumentNonBlocking(userAchievementsRef, {
                            achievementId: 'first-log',
                            dateEarned: serverTimestamp(),
                        });
                        toast({
                            title: "Conquista Desbloqueada!",
                            description: "Primeiro Registro: Você atualizou seu perfil pela primeira vez.",
                            className: "bg-accent text-accent-foreground border-accent"
                        });
                    }
                }
            } else {
                toast({
                    title: "Erro ao salvar",
                    description: profileState.message,
                    variant: "destructive",
                });
            }
        }
    }, [profileState, toast, userAchievementsRef, userAchievements]);


    useEffect(() => {
        const errorMsg = projectionState.message;
        if (errorMsg && (projectionState.errors || (!projectionState.data && !projectionState.errors))) {
            toast({
                title: "Erro na Projeção",
                description: errorMsg,
                variant: "destructive",
            });
        }
        if (projectionState.data?.recommendedDailyCalories) {
            form.setValue('dailyCalorieGoal', Math.round(projectionState.data.recommendedDailyCalories));
            
            if(userAchievementsRef) {
                const hasAiGeniusAchievement = userAchievements?.some(ach => ach.achievementId === 'ai-genius');
                if (!hasAiGeniusAchievement) {
                    addDocumentNonBlocking(userAchievementsRef, {
                        achievementId: 'ai-genius',
                        dateEarned: serverTimestamp(),
                    });
                    toast({
                        title: "Conquista Desbloqueada!",
                        description: "Gênio da IA: Você usou a projeção de meta pela primeira vez.",
                        className: "bg-accent text-accent-foreground border-accent"
                    });
                }
            }
        }
    }, [projectionState, toast, userAchievementsRef, userAchievements, form]);

    const handleAddWeightMeasurement = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const weightValue = parseFloat((e.currentTarget.elements.namedItem('newWeight') as HTMLInputElement).value);

        if (!user || !firestore || isNaN(weightValue) || weightValue <= 0) {
            toast({
                title: "Valor Inválido",
                description: "Por favor, insira um valor de peso válido.",
                variant: "destructive",
            });
            return;
        }

        const weightMeasurementsCollection = collection(firestore, `users/${user.uid}/weightMeasurements`);
        addDocumentNonBlocking(weightMeasurementsCollection, {
            weight: weightValue,
            date: new Date().toISOString(),
            createdAt: serverTimestamp(),
        });
        
        if(userProfileRef){
            setDocumentNonBlocking(userProfileRef, { currentWeight: weightValue }, { merge: true });
        }
        
        if (userAchievementsRef && userProfile?.weightGoal) {
            const hasMilestoneAchievement = userAchievements?.some(ach => ach.achievementId === 'weight-loss-milestone');
            if (!hasMilestoneAchievement && weightValue <= userProfile.weightGoal) {
                addDocumentNonBlocking(userAchievementsRef, {
                    achievementId: 'weight-loss-milestone',
                    dateEarned: serverTimestamp(),
                });
                toast({
                    title: "Conquista Desbloqueada!",
                    description: "Marco Atingido: Você alcançou sua meta de peso!",
                    className: "bg-accent text-accent-foreground border-accent"
                });
            }
        }

        toast({
            title: "Peso Registrado!",
            description: `Seu novo peso de ${weightValue} kg foi salvo.`,
        });

        weightFormRef.current?.reset();
    };

    const handleAcceptGoal = (newGoal: number) => {
        if (!userProfileRef) return;
        setDocumentNonBlocking(userProfileRef, { dailyCalorieGoal: newGoal }, { merge: true });
        toast({
          title: "Meta Atualizada!",
          description: `Sua nova meta diária de calorias é ${newGoal} kcal.`,
        });
    }

    const handleSaveCustomGoal = () => {
        const newGoal = Number(dailyCalorieGoal);
        if (isNaN(newGoal) || newGoal <= 0) {
        toast({ title: "Valor inválido", description: "Por favor, insira uma meta de calorias válida.", variant: "destructive" });
        return;
        }
        handleAcceptGoal(newGoal);
        setIsEditingGoal(false);
    }
    
    if (isProfileLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                     <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-40" />
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    const { formState: { isSubmitting } } = form;


    return (
        <div className="space-y-6">
          <Form {...form}>
            <form action={profileAction}>
              <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Meu Perfil</CardTitle>
                        <CardDescription>
                            Atualize suas informações para obter projeções e dicas personalizadas da IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <input type="hidden" {...form.register('uid')} />
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Seu nome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="currentWeight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Peso Atual (kg)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.1" placeholder="85.5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name="height"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Altura (cm)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="175" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="space-y-2">
                                <Label>Seu IMC</Label>
                                <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                                {bmi !== null ? (
                                        <span>{bmi} - <span className={bmiCategory.color}>{bmiCategory.category}</span></span>
                                    ) : (
                                        <span className="text-muted-foreground">Preencha peso e altura</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="weightGoal"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Meta de Peso (kg)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.1" placeholder="75" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="dailyCalorieGoal"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Meta Diária de Calorias (kcal)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="10" placeholder="2200" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="age"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Idade</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gênero</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Masculino</SelectItem>
                                      <SelectItem value="female">Feminino</SelectItem>
                                      <SelectItem value="other">Outro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>

                         <FormField
                            control={form.control}
                            name="activityLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nível de Atividade</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="sedentary">Sedentário</SelectItem>
                                        <SelectItem value="lightly active">Levemente Ativo</SelectItem>
                                        <SelectItem value="moderately active">Moderadamente Ativo</SelectItem>
                                        <SelectItem value="very active">Muito Ativo</SelectItem>
                                        <SelectItem value="extra active">Extremamente Ativo</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                       
                         <FormField
                            control={form.control}
                            name="dietaryPreferences"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preferências Alimentares</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ex: Vegetariano, baixo carboidrato, sem glúten..." {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Isso ajuda a IA a fornecer dicas mais relevantes.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                     <CardFooter className="flex justify-end p-4 border-t">
                        <Button type="submit" disabled={isSubmitting} variant="secondary">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
              </Card>
            </form>
          </Form>

            <Card>
                <form action={projectionAction}>
                    {/* Pass all form values from react-hook-form's state */}
                    <input type="hidden" name="currentWeight" value={form.watch('currentWeight') || ''} />
                    <input type="hidden" name="height" value={form.watch('height') || ''} />
                    <input type="hidden" name="goalWeight" value={form.watch('weightGoal') || ''} />
                    <input type="hidden" name="age" value={form.watch('age') || ''} />
                    <input type="hidden" name="gender" value={form.watch('gender') || ''} />
                    <input type="hidden" name="activityLevel" value={form.watch('activityLevel') || ''} />
                    <input type="hidden" name="dietaryPreferences" value={form.watch('dietaryPreferences') || ''} />
                    
                    <CardHeader>
                        <CardTitle className="font-headline">Projeção de Meta com IA</CardTitle>
                        <CardDescription>Use a inteligência artificial para criar um plano de calorias e obter dicas para alcançar seu objetivo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="goalTimelineWeeks">Em quanto tempo (semanas) quer atingir a meta?</Label>
                            <Input id="goalTimelineWeeks" name="goalTimelineWeeks" type="number" defaultValue="12" required />
                            {projectionState.errors?.goalTimelineWeeks && <p className="text-destructive text-sm mt-1">{projectionState.errors.goalTimelineWeeks[0]}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-4">
                        <div className="flex justify-end">
                            <ProjectionSubmitButton />
                        </div>
                        {projectionState.data && (
                            <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 w-full space-y-4 animate-in fade-in-50 duration-500">
                            <h3 className="font-headline text-lg font-semibold text-primary-foreground/90">Plano Sugerido pela IA ✨</h3>
                            
                            <div className="bg-background/50 rounded-md p-3">
                                <Label>Meta de Calorias Diária</Label>
                                {isEditingGoal ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input 
                                            type="number" 
                                            value={dailyCalorieGoal || ''}
                                            onChange={(e) => form.setValue('dailyCalorieGoal', e.target.value === '' ? undefined : e.target.valueAsNumber)}
                                            name="dailyCalorieGoal"
                                            className="max-w-[120px]"
                                        />
                                        <Button size="icon" className="h-8 w-8" onClick={handleSaveCustomGoal}><Check className="h-4 w-4"/></Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                    <p className="text-2xl font-bold text-accent">{Math.round(projectionState.data.recommendedDailyCalories)} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditingGoal(true)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleAcceptGoal(Math.round(projectionState.data!.recommendedDailyCalories))}
                                        disabled={isEditingGoal}
                                        type="button"
                                        >
                                        <Check className="mr-2 h-4 w-4"/> Aceitar Meta
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <h4 className="font-semibold pt-2">Dicas Personalizadas:</h4>
                                <p className="text-sm whitespace-pre-wrap">{projectionState.data.personalizedTips}</p>
                            </div>
                            <p className="text-xs text-muted-foreground pt-2">
                                Isso se baseia em um déficit diário de <span className="font-semibold">{Math.round(projectionState.data.requiredWeeklyDeficit / 7)} calorias</span>.
                            </p>
                            </div>
                        )}
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Registrar Novo Peso</CardTitle>
                    <CardDescription>
                        Adicione uma nova medição de peso para acompanhar seu progresso. Isso também atualizará seu peso atual no perfil.
                    </CardDescription>
                </CardHeader>
                 <form onSubmit={handleAddWeightMeasurement} ref={weightFormRef}>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="newWeight">Novo Peso (kg)</Label>
                            <Input
                                id="newWeight"
                                name="newWeight"
                                type="number"
                                step="0.1"
                                placeholder="Ex: 84.5"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Registrar Peso</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
