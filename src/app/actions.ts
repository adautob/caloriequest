'use server';

import { projectWeightLossTimeline, ProjectWeightLossTimelineInput } from "@/ai/flows/project-weight-loss-timeline";
import { logMeal, LogMealOutput } from '@/ai/flows/log-meal';
import { z } from "zod";

// --- Goal Projection Action ---

const goalProjectionFormSchema = z.object({
  currentWeight: z.coerce.number().min(30, "Peso deve ser no mínimo 30kg."),
  goalWeight: z.coerce.number().min(30, "Meta de peso deve ser no mínimo 30kg."),
  height: z.coerce.number().min(100, "Altura deve ser no mínimo 100cm."),
  age: z.coerce.number().min(13, "Você deve ter pelo menos 13 anos."),
  gender: z.string(),
  activityLevel: z.string(),
  dietaryPreferences: z.string().min(3, "Preferências muito curtas."),
  weeklyCalorieDeficit: z.coerce.number().min(100, "Déficit calórico deve ser no mínimo 100."),
}).refine(data => data.currentWeight > data.goalWeight, {
  message: "O peso atual deve ser maior que a meta de peso.",
  path: ["goalWeight"],
});

type GoalProjectionState = {
  message?: string | null;
  data?: {
    projectedTimelineWeeks: number;
    personalizedTips: string;
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
    return {
      message: "Por favor, corrija os erros no formulário.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const input: ProjectWeightLossTimelineInput = validatedFields.data;
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

const profileFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  currentWeight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  weightGoal: z.coerce.number().optional(),
  age: z.coerce.number().optional(),
  gender: z.string().optional(),
  activityLevel: z.string().optional(),
  dietaryPreferences: z.string().optional(),
});


type UpdateProfileState = {
    message: string;
    errors?: {
        [key: string]: string[] | undefined;
    } | null;
    success: boolean;
}

export async function updateProfile(
    prevState: UpdateProfileState,
    formData: FormData,
): Promise<UpdateProfileState> {
    const validatedFields = profileFormSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            message: "Por favor, corrija os erros no formulário.",
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }
    
    // This is a server action, but we can't interact with Firebase from here
    // directly due to client/server constraints in this setup.
    // The actual Firebase update will be triggered from the client component
    // after this action successfully returns the validated data.
    // This action's primary role is validation.

    return {
        message: "Dados validados com sucesso! O perfil será atualizado.",
        errors: null,
        success: true,
    }
}
    