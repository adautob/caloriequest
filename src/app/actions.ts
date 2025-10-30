'use server';

import { projectWeightLossTimeline, ProjectWeightLossTimelineInput } from "@/ai/flows/project-weight-loss-timeline";
import { logMeal, LogMealOutput } from '@/ai/flows/log-meal';
import { getDailyTip, GetDailyTipInput } from "@/ai/flows/get-daily-tip";
import { z } from "zod";
import { getFirebase } from "@/firebase/server-provider";
import { doc, setDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// --- Profile Schemas ---

const profileFormSchema = z.object({
  uid: z.string().min(1, { message: "UID do usuário é obrigatório." }),
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  currentWeight: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({invalid_type_error: "Peso inválido"}).optional()
  ),
  height: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({invalid_type_error: "Altura inválida"}).optional()
  ),
  weightGoal: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({invalid_type_error: "Meta de peso inválida"}).optional()
  ),
  age: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({invalid_type_error: "Idade inválida"}).optional()
  ),
  gender: z.string().optional(),
  activityLevel: z.string().optional(),
  dietaryPreferences: z.string().optional(),
  dailyCalorieGoal: z.preprocess(
    (val) => (val === '' ? undefined : val),
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
    
    const validatedFields = profileFormSchema.safeParse(Object.fromEntries(formData.entries()));
    
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

    try {
        const { firestore } = getFirebase();
        const userProfileRef = doc(firestore, 'users', uid);
        
        // Create an object with only the defined values to avoid overwriting fields with undefined
        const dataToSave: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(profileData)) {
            if (value !== undefined) {
                dataToSave[key] = value;
            }
        }
        
        await setDoc(userProfileRef, dataToSave, { merge: true });

        revalidatePath('/profile');
        revalidatePath('/');

        return {
            message: "Seu perfil foi atualizado com sucesso!",
            success: true,
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        return {
            message: "Ocorreu um erro ao atualizar seu perfil.",
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
