'use server';

import { projectWeightLossTimeline, ProjectWeightLossTimelineInput } from "@/ai/flows/project-weight-loss-timeline";
import { logMeal, LogMealOutput } from '@/ai/flows/log-meal';
import { getDailyTip, GetDailyTipInput } from "@/ai/flows/get-daily-tip";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { doc, setDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { getFirestoreForServerAction } from "@/firebase/server-actions";


// --- Profile Schemas ---

const profileFormSchema = z.object({
  uid: z.string().min(1, { message: "UID do usuário é obrigatório." }),
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


// --- Goal Projection Action ---

export type GoalProjectionState = {
  message?: string | null;
  data?: {
    requiredWeeklyDeficit: number;
    personalizedTips: string;
    recommendedDailyCalories: number;
  } | null;
  errors?: {
    [key: string]: string[] | undefined;
  } | null;
}

export async function getGoalProjection(
  prevState: GoalProjectionState,
  formData: FormData,
): Promise<GoalProjectionState> {
  const validatedFields = goalProjectionFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorDetails = validatedFields.error.flatten().fieldErrors;
    const errorString = Object.entries(errorDetails)
      .map(([fieldName, errors]) => `${fieldName}: ${errors.join(', ')}`)
      .join('; ');

    return {
      message: `Erros de validação: ${errorString}`,
      errors: errorDetails,
    };
  }

  try {
    const input: ProjectWeightLossTimelineInput = {
      ...validatedFields.data,
      dietaryPreferences: validatedFields.data.dietaryPreferences || 'Nenhuma'
    };
    const result = await projectWeightLossTimeline(input);
    return {
      message: "Projeção calculada com sucesso!",
      data: result,
      errors: null,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Ocorreu um erro ao calcular a projeção. Tente novamente.",
      data: null,
      errors: null,
    };
  }
}


// --- Add Meal Action ---

const addMealFormSchema = z.object({
  foodDescription: z.string().min(3, "A descrição da refeição deve ter pelo menos 3 caracteres."),
});

type AddMealState = {
  message?: string | null;
  nutritionalInfo?: LogMealOutput | null;
  errors?: {
    foodDescription?: string[];
  } | null;
  success?: boolean;
}

export async function addMeal(
  prevState: AddMealState,
  formData: FormData
): Promise<AddMealState> {
    const validatedFields = addMealFormSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            message: "Por favor, corrija os erros no formulário.",
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    const { foodDescription } = validatedFields.data;
    
    try {
        const nutritionalInfo = await logMeal({ foodDescription });
        if (!nutritionalInfo) {
          throw new Error("A IA não retornou informações nutricionais.");
        }
        return {
            message: `"${nutritionalInfo.name}" analisado com sucesso!`,
            nutritionalInfo,
            errors: null,
            success: true,
        }
    } catch(error) {
        console.error("Error getting nutritional info from AI:", error);
        return {
            message: "Ocorreu um erro ao analisar sua refeição. A IA pode não ter conseguido processar a descrição. Tente novamente com mais detalhes.",
            errors: null,
            success: false,
        }
    }
}

// --- Update Profile Action ---

export type UpdateProfileState = {
    message: string;
    errors?: z.ZodError['errors'];
    success: boolean;
}

export async function updateProfile(
    prevState: UpdateProfileState,
    formData: FormData,
): Promise<UpdateProfileState> {
    console.log('--- [ACTION] updateProfile iniciada ---');
    
    const rawData = Object.fromEntries(formData.entries());
    console.log('[ACTION] Dados recebidos do formulário:', rawData);
    
    const validatedFields = profileFormSchema.safeParse(rawData);
    console.log('[ACTION] Resultado da validação:', JSON.stringify(validatedFields, null, 2));
    
    if (!validatedFields.success) {
        return {
            message: "Dados inválidos.",
            errors: validatedFields.error.errors,
            success: false,
        }
    }
    
    const { uid, ...profileData } = validatedFields.data;

    if (!uid) {
        return {
            message: "Você precisa estar logado para atualizar o perfil.",
            success: false,
        }
    }
    
    console.log(`[ACTION] Preparando para salvar dados para o UID: ${uid}`);
    
    try {
        console.log('[ACTION] Inicializando Firebase...');
        const { firestore } = getFirestoreForServerAction();
        const userProfileRef = doc(firestore, 'users', uid);
        
        const dataToSave: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(profileData)) {
            if (value !== undefined) {
                dataToSave[key] = value;
            }
        }
        
        // This fails because getFirestoreForServerAction() returns an unauthenticated client
        // and security rules are (correctly) blocking the write.
        // The proper way to fix this is to get an auth token from the client, pass it
        // to the server action, and use the Admin SDK to verify it and then perform
        // the write. However, that requires a more complex setup.
        // A simpler, though less secure, approach would be to make the 'users' collection
        // world-writable, but that's a very bad idea.
        // Let's assume for now the user wants to get this working without a full auth overhaul.
        // The most direct fix is to perform the write from the client-side, but the user
        // has structured this as a server action.
        // The error indicates a permissions issue. The server client is not authenticated.
        // We cannot easily authenticate the server client in a Server Action without the Admin SDK
        // and a verified ID token from the client.

        // The simplest "fix" that keeps the server action structure is to use the Admin SDK
        // properly, but that requires setup I can't do (service account).
        // The user's logs showed that `getFirestoreForServerAction` was initializing but the write was failing.
        // This is 100% a security rules issue.

        // The current Firestore rules are probably:
        // rules_version = '2';
        // service cloud.firestore {
        //   match /databases/{database}/documents {
        //     match /users/{userId} {
        //       allow read, write: if request.auth != null && request.auth.uid == userId;
        //     }
        //     // other rules
        //   }
        // }
        // The server action client has `request.auth == null`.

        // Given the constraints, I cannot fix the security rules. I also cannot implement
        // a full ID token verification flow. The only path forward is to admit defeat on the
        // server-side write and move the logic to the client. But that's a huge change.
        // The user is asking me to fix the existing code.

        // Let's rethink. `getFirestoreForServerAction` uses the standard client SDK, not admin.
        // So `setDoc` will fail because there is no logged-in user in the server action's context.

        // The error from the user before was "Cannot access safeParse on the server".
        // That happened because I moved the schema to the client. I moved it back.
        // The error before that was about `server-provider`.

        // Okay, the core issue is AUTHENTICATION in a server action. The user's code
        // `getFirestoreForServerAction` creates an unauthenticated client. There's no way around
        // this without the Admin SDK or passing an ID token.
        
        // My previous attempts to fix this were all wrong because I was missing the fundamental auth piece.

        // I can't add the Admin SDK correctly.
        // I can't change the security rules.

        // What if I just remove the server action and do it on the client? That's what a human would do.
        // `updateProfile` is called from `ProfileForm.tsx`. I could change `ProfileForm` to not use
        // a server action and just use `setDoc` from the client-side Firebase SDK, which is already authenticated.
        // This would be the "correct" fix. It would involve changing `ProfileForm.tsx` significantly.
        // Let's try that. It's a big change but it's the right one.

        // I will change ProfileForm.tsx to perform a client-side write instead of calling a server action.
        // This means I will remove the use of `useActionState` for the profile update.

        await setDoc(userProfileRef, dataToSave, { merge: true });

        console.log(`[ACTION] Dados para UID: ${uid} salvos com sucesso.`);

        revalidatePath('/profile');
        revalidatePath('/');

        return {
            message: "Seu perfil foi atualizado com sucesso!",
            success: true,
        }
    } catch (error: any) {
        console.error("[ACTION] Erro ao atualizar perfil no Firestore:", error);
        return {
            message: "Ocorreu um erro ao atualizar seu perfil. Verifique as permissões do Firestore.",
            success: false,
        }
    }
}

// --- Get Daily Tip Action ---
export async function fetchDailyTip(input: GetDailyTipInput): Promise<string> {
  try {
    const result = await getDailyTip(input);
    return result.tip;
  } catch (error) {
    console.error("Error fetching daily tip:", error);
    return "Não foi possível carregar a dica de hoje. Tente novamente mais tarde.";
  }
}
