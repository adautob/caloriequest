'use client';

import { useActionState, useEffect, useMemo, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { updateProfile, UpdateProfileState } from '@/app/actions';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const initialState: UpdateProfileState = {
    message: "",
    data: null,
    errors: null,
    success: false,
};

function SubmitButton() {  
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      Salvar Alterações
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
    const [state, formAction] = useActionState(updateProfile, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const weightFormRef = useRef<HTMLFormElement>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const [weight, setWeight] = useState<number | undefined>(userProfile?.currentWeight);
    const [height, setHeight] = useState<number | undefined>(userProfile?.height);
    const [newWeight, setNewWeight] = useState<string>('');


    const bmi = useMemo(() => calculateBmi(weight, height), [weight, height]);
    const bmiCategory = getBmiCategory(bmi);
    
    const [formKey, setFormKey] = useState(Date.now());
    
    useEffect(() => {
        if (userProfile) {
            setWeight(userProfile.currentWeight);
            setHeight(userProfile.height);
            setFormKey(Date.now());
        }
    }, [userProfile]);

    useEffect(() => {
        if (state.success && state.data && userProfileRef) {
            toast({
                title: "Sucesso!",
                description: "Seu perfil foi atualizado.",
            });

            const profileUpdate = state.data;

            setDocumentNonBlocking(userProfileRef, profileUpdate, { merge: true });

        } else if (state.message && state.errors) {
            toast({
                title: "Erro ao salvar",
                description: state.message,
                variant: "destructive",
            });
        }
    }, [state, toast, userProfileRef]);

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
        
        // Also update currentWeight on the profile
        if(userProfileRef){
            setDocumentNonBlocking(userProfileRef, { currentWeight: weightValue }, { merge: true });
        }


        toast({
            title: "Peso Registrado!",
            description: `Seu peso de ${weightValue} kg foi salvo.`,
        });

        setNewWeight('');
        weightFormRef.current?.reset();
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
                <CardHeader>
                    <CardTitle className="font-headline">Meu Perfil</CardTitle>
                    <CardDescription>
                        Atualize suas informações pessoais e metas de saúde.
                    </CardDescription>
                </CardHeader>
                <form action={formAction} key={formKey} ref={formRef}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" defaultValue={userProfile?.name || user?.displayName || ''} required/>
                            {state.errors?.name && <p className="text-destructive text-sm mt-1">{state.errors.name[0]}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                                <Input id="currentWeight" name="currentWeight" type="number" step="0.1" defaultValue={userProfile?.currentWeight || ''} onChange={e => setWeight(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height">Altura (cm)</Label>
                                <Input id="height" name="height" type="number" defaultValue={userProfile?.height || ''} onChange={e => setHeight(Number(e.target.value))}/>
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
                                <Input id="weightGoal" name="weightGoal" type="number" step="0.1" defaultValue={userProfile?.weightGoal || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dailyCalorieGoal">Meta Diária de Calorias (kcal)</Label>
                                <Input id="dailyCalorieGoal" name="dailyCalorieGoal" type="number" step="10" defaultValue={userProfile?.dailyCalorieGoal || ''} />
                            </div>
                        </div>

                        <h3 className="text-lg font-medium text-foreground pt-4 border-t">Dados para Projeção da IA</h3>
                        <p className="text-sm text-muted-foreground -mt-4">Essas informações são usadas pela IA para criar projeções e dicas personalizadas.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="age">Idade</Label>
                                <Input id="age" name="age" type="number" defaultValue={userProfile?.age || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gênero</Label>
                                <Select name="gender" defaultValue={userProfile?.gender || undefined}>
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
                            <Select name="activityLevel" defaultValue={userProfile?.activityLevel || undefined}>
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
                            <Textarea id="dietaryPreferences" name="dietaryPreferences" placeholder="Ex: Vegetariano, baixo carboidrato, sem glúten..." defaultValue={userProfile?.dietaryPreferences || ''}/>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <SubmitButton />
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Registrar Novo Peso</CardTitle>
                    <CardDescription>
                        Adicione uma nova medição de peso para acompanhar seu progresso.
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
