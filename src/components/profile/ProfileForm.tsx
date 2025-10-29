'use client';

import { useActionState, useEffect, useMemo, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Wand2, Check, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { updateProfile, UpdateProfileState, getGoalProjection } from '@/app/actions';
import type { UserProfile, UserAchievement } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const initialProfileState: UpdateProfileState = {
    message: "",
    data: null,
    errors: null,
    success: false,
};

const initialProjectionState = {
  message: null,
  data: null,
  errors: null,
};

function SubmitButton() {  
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      Salvar Alterações
    </Button>
  );
}

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
    const projectionFormRef = useRef<HTMLFormElement>(null);

    const [profileState, profileAction] = useActionState(updateProfile, initialProfileState);
    const [projectionState, projectionAction] = useActionState(getGoalProjection, initialProjectionState);

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

    const [formData, setFormData] = useState({
      name: '',
      currentWeight: '',
      height: '',
      weightGoal: '',
      dailyCalorieGoal: '',
      age: '',
      gender: '',
      activityLevel: 'lightly active',
      dietaryPreferences: '',
    });
    
    const [newWeight, setNewWeight] = useState<string>('');
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    
    const bmi = useMemo(() => calculateBmi(Number(formData.currentWeight), Number(formData.height)), [formData.currentWeight, formData.height]);
    const bmiCategory = getBmiCategory(bmi);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || user?.displayName || '',
                currentWeight: userProfile.currentWeight?.toString() || '',
                height: userProfile.height?.toString() || '',
                weightGoal: userProfile.weightGoal?.toString() || '',
                dailyCalorieGoal: userProfile.dailyCalorieGoal?.toString() || '',
                age: userProfile.age?.toString() || '',
                gender: userProfile.gender || '',
                activityLevel: userProfile.activityLevel || 'lightly active',
                dietaryPreferences: userProfile.dietaryPreferences || '',
            });
        }
    }, [userProfile, user]);

     useEffect(() => {
        if (profileState.success && profileState.data && userProfileRef) {
            toast({
                title: "Sucesso!",
                description: "Seu perfil foi atualizado.",
            });

            const profileUpdate = profileState.data;
            setDocumentNonBlocking(userProfileRef, profileUpdate, { merge: true });

            if(userAchievementsRef) {
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

        } else if (profileState.message && profileState.errors) {
            toast({
                title: "Erro ao salvar",
                description: profileState.message,
                variant: "destructive",
            });
        }
    }, [profileState, toast, userProfileRef, userAchievementsRef, userAchievements]);

    useEffect(() => {
        if (projectionState.message && (projectionState.errors || (!projectionState.data && !projectionState.errors))) {
            toast({
                title: "Erro na Projeção",
                description: projectionState.message,
                variant: "destructive",
            });
        }
        if (projectionState.data?.recommendedDailyCalories) {
            setFormData(prev => ({...prev, dailyCalorieGoal: Math.round(projectionState.data!.recommendedDailyCalories).toString()}));
            
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
    }, [projectionState, toast, userAchievementsRef, userAchievements]);

    const handleAddWeightMeasurement = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const weightValue = parseFloat(newWeight);
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
            description: `Seu peso de ${weightValue} kg foi salvo.`,
        });

        setNewWeight('');
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
        const newGoal = Number(formData.dailyCalorieGoal);
        if (isNaN(newGoal) || newGoal <= 0) {
        toast({ title: "Valor inválido", description: "Por favor, insira uma meta de calorias válida.", variant: "destructive" });
        return;
        }
        handleAcceptGoal(newGoal);
        setIsEditingGoal(false);
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
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

    return (
        <div className="space-y-6">
            <Card>
              <form action={profileAction}>
                    <CardHeader>
                        <CardTitle className="font-headline">Meu Perfil</CardTitle>
                        <CardDescription>
                            Atualize suas informações para obter projeções e dicas personalizadas da IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required/>
                            {profileState.errors?.name && <p className="text-destructive text-sm mt-1">{profileState.errors.name[0]}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                                <Input id="currentWeight" name="currentWeight" type="number" step="0.1" value={formData.currentWeight} onChange={handleInputChange} />
                                {profileState.errors?.currentWeight && <p className="text-destructive text-sm mt-1">{profileState.errors.currentWeight[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height">Altura (cm)</Label>
                                <Input id="height" name="height" type="number" value={formData.height} onChange={handleInputChange} />
                                 {profileState.errors?.height && <p className="text-destructive text-sm mt-1">{profileState.errors.height[0]}</p>}
                            </div>
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
                            <div className="space-y-2">
                                <Label htmlFor="weightGoal">Meta de Peso (kg)</Label>
                                <Input id="weightGoal" name="weightGoal" type="number" step="0.1" value={formData.weightGoal} onChange={handleInputChange} />
                                {profileState.errors?.weightGoal && <p className="text-destructive text-sm mt-1">{profileState.errors.weightGoal[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dailyCalorieGoal">Meta Diária de Calorias (kcal)</Label>
                                <Input id="dailyCalorieGoal" name="dailyCalorieGoal" type="number" step="10" value={formData.dailyCalorieGoal} onChange={handleInputChange} />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="age">Idade</Label>
                                <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} />
                                {profileState.errors?.age && <p className="text-destructive text-sm mt-1">{profileState.errors.age[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gênero</Label>
                                <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Masculino</SelectItem>
                                    <SelectItem value="female">Feminino</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="activityLevel">Nível de Atividade</Label>
                            <Select name="activityLevel" value={formData.activityLevel} onValueChange={(value) => handleSelectChange('activityLevel', value)}>
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

                        <div className="space-y-2">
                            <Label htmlFor="dietaryPreferences">Preferências Alimentares</Label>
                            <Textarea id="dietaryPreferences" name="dietaryPreferences" placeholder="Ex: Vegetariano, baixo carboidrato, sem glúten..." value={formData.dietaryPreferences} onChange={handleInputChange}/>
                        </div>
                    </CardContent>
                     <CardFooter className="flex justify-end p-4 border-t">
                        <SubmitButton />
                    </CardFooter>
                </form>
                </Card>

                <Card>
                    <form action={projectionAction} ref={projectionFormRef}>
                        <input type="hidden" name="currentWeight" value={formData.currentWeight || ''} />
                        <input type="hidden" name="height" value={formData.height || ''} />
                        <input type="hidden" name="weightGoal" value={formData.weightGoal || ''} />
                        <input type="hidden" name="age" value={formData.age || ''} />
                        <input type="hidden" name="gender" value={formData.gender || ''} />
                        <input type="hidden" name="activityLevel" value={formData.activityLevel || ''} />
                        <input type="hidden" name="dietaryPreferences" value={formData.dietaryPreferences || ''} />
                        
                        <CardHeader>
                            <CardTitle className="font-headline">Projeção de Meta com IA</CardTitle>
                            <CardDescription>Use a inteligência artificial para criar um plano de calorias e obter dicas para alcançar seu objetivo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="goalTimelineWeeks">Em quanto tempo (semanas) quer atingir a meta?</Label>
                                <Input id="goalTimelineWeeks" name="goalTimelineWeeks" type="number" defaultValue="12" required />
                                {projectionState.errors?.goalTimelineWeeks && <p className="text-destructive text-sm mt-1">{projectionState.errors.goalTimelineWeeks[0]}</p>}
                                {projectionState.errors?.goalWeight && <p className="text-destructive text-sm mt-1">{projectionState.errors.goalWeight[0]}</p>}
                                {projectionState.errors?.currentWeight && <p className="text-destructive text-sm mt-1">{projectionState.errors.currentWeight[0]}</p>}
                                {projectionState.errors?.height && <p className="text-destructive text-sm mt-1">{projectionState.errors.height[0]}</p>}
                                {projectionState.errors?.age && <p className="text-destructive text-sm mt-1">{projectionState.errors.age[0]}</p>}
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
                                                value={formData.dailyCalorieGoal}
                                                onChange={(e) => handleInputChange(e)}
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
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
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
