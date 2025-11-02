'use client';
import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { WeightMeasurement } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit, Save, X, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function WeightHistoryItem({ measurement }: { measurement: WeightMeasurement }) {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [weightValue, setWeightValue] = useState(measurement.weight);
    const [isLoading, setIsLoading] = useState(false);

    const docRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/weightMeasurements`, measurement.id);
    }, [user, firestore, measurement.id]);

    const handleDelete = () => {
        if (!docRef) return;
        deleteDocumentNonBlocking(docRef);
        toast({
            title: "Medição Excluída",
            description: "O registro de peso foi removido com sucesso.",
        });
    };

    const handleSave = () => {
        if (!docRef || isNaN(weightValue) || weightValue <= 0) {
            toast({
                title: "Valor Inválido",
                description: "Por favor, insira um valor de peso válido.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        updateDocumentNonBlocking(docRef, { weight: weightValue });
        toast({
            title: "Peso Atualizado",
            description: `O registro foi atualizado para ${weightValue} kg.`,
        });
        setIsLoading(false);
        setIsEditing(false);
    };

    const formattedDate = format(new Date(measurement.date), "PPP", { locale: ptBR });

    return (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover:bg-muted/80 transition-colors group">
            <div className="flex items-center gap-4">
                <div className="font-semibold">{formattedDate}</div>
                {isEditing ? (
                    <Input
                        type="number"
                        value={weightValue}
                        onChange={(e) => setWeightValue(parseFloat(e.target.value))}
                        className="h-8 w-24"
                        autoFocus
                    />
                ) : (
                    <div className="text-muted-foreground">{measurement.weight} kg</div>
                )}
            </div>
            <div className="flex items-center gap-1">
                {isEditing ? (
                    <>
                        <Button size="icon" variant="ghost" onClick={handleSave} disabled={isLoading} className="h-8 w-8 text-green-600 hover:text-green-700">
                            {isLoading ? <Loader2 className="animate-spin" /> : <Save />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 w-8 text-red-600 hover:text-red-700">
                            <X />
                        </Button>
                    </>
                ) : (
                    <>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a medição de <strong>{measurement.weight}kg</strong> do dia <strong>{formattedDate}</strong>.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </div>
        </div>
    );
}

export default function WeightHistory() {
    const { user, firestore } = useFirebase();

    const weightQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/weightMeasurements`), orderBy('date', 'desc'));
    }, [user, firestore]);

    const { data: weightMeasurements, isLoading } = useCollection<WeightMeasurement>(weightQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Histórico de Peso</CardTitle>
                <CardDescription>Visualize, edite ou exclua suas medições de peso anteriores.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}
                {!isLoading && weightMeasurements && weightMeasurements.length > 0 && (
                    <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                        {weightMeasurements.map(m => (
                            <WeightHistoryItem key={m.id} measurement={m} />
                        ))}
                    </div>
                )}
                {!isLoading && (!weightMeasurements || weightMeasurements.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro de peso encontrado.</p>
                )}
            </CardContent>
        </Card>
    );
}
