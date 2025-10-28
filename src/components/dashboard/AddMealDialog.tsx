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
import { useUser } from "@/firebase";
import { useFormStatus } from "react-dom";
import { addMeal } from "@/app/actions";
import { useEffect, useState, useRef, useActionState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

const initialState = {
  message: null,
  errors: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      Salvar Refeição
    </Button>
  );
}

export default function AddMealDialog({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(addMeal, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast({
        title: "Sucesso!",
        description: state.message,
      });
      setIsOpen(false);
      formRef.current?.reset();
    } else if (state.message) {
       toast({
        title: "Erro ao adicionar refeição",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast]);

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
           <input type="hidden" name="userId" value={user?.uid} />
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
