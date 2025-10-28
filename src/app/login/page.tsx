'use client';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';

function signInWithGoogle(auth: any) {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
}

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Dumbbell className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Dumbbell className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground font-headline">
            CalorieQuest
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Sua jornada para uma vida mais saudável começa aqui.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <Button
            onClick={() => signInWithGoogle(auth)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            variant="default"
            size="lg"
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C307.4 99.8 280.7 86 248 86c-84.3 0-152.3 67.8-152.3 151.4s68 151.4 152.3 151.4c99.9 0 133-67.1 136.3-100.4H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            Entrar com Google
          </Button>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
