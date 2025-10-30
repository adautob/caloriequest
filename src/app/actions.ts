'use server';

import { projectWeightLossTimeline, ProjectWeightLossTimelineInput } from "@/ai/flows/project-weight-loss-timeline";
import { logMeal, LogMealOutput } from '@/ai/flows/log-meal';
import { getDailyTip, GetDailyTipInput } from "@/ai/flows/get-daily-tip";
import { z } from "zod";
import { getFirebase } from "@/firebase/server-provider";
import { doc, setDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

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
  schema: z.ZodType<any, any, any>,
  prevState: GoalProjectionState,
  formData: FormData,
): Promise<GoalProjectionState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

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
    schema: z.ZodType<any, any, any>,
    prevState: UpdateProfileState,
    formData: FormData,
): Promise<UpdateProfileState> {
    
    const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));
    
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
        
        await setDoc(userProfileRef, profileData, { merge: true });

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
