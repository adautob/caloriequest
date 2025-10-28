'use server';

import { projectWeightLossTimeline, ProjectWeightLossTimelineInput } from "@/ai/flows/project-weight-loss-timeline";
import { logMeal } from '@/ai/flows/log-meal';
import { z } from "zod";
import { collection, serverTimestamp } from "firebase/firestore";
import { getSdks, addDocumentNonBlocking } from "@/firebase/index";
import { initializeFirebase } from "@/firebase";

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
  userId: z.string(),
  foodDescription: z.string().min(3, "A descrição da refeição deve ter pelo menos 3 caracteres."),
});

type AddMealState = {
  message?: string | null;
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

    const { foodDescription, userId } = validatedFields.data;
    let nutritionalInfo;

    try {
        // 1. Get nutritional info from AI
        nutritionalInfo = await logMeal({ foodDescription });
    } catch(error) {
        console.error("Error getting nutritional info from AI:", error);
        return {
            message: "Ocorreu um erro ao analisar sua refeição. A IA pode não ter conseguido processar a descrição. Tente novamente com mais detalhes.",
            errors: null,
            success: false,
        }
    }

    if (!nutritionalInfo) {
        return {
            message: "A IA não retornou informações nutricionais. Tente descrever sua refeição de outra forma.",
            errors: null,
            success: false,
        }
    }
    
    try {
      // 2. Save to Firestore
      const { firestore } = getSdks(initializeFirebase().firebaseApp);
      const mealsCollection = collection(firestore, `users/${userId}/meals`);
      
      // Use non-blocking update
      addDocumentNonBlocking(mealsCollection, {
          ...nutritionalInfo,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          createdAt: serverTimestamp(),
      });

      return {
          message: `"${nutritionalInfo.name}" adicionado com sucesso!`,
          errors: null,
          success: true,
      }
    } catch(error) {
        console.error("Error saving meal to Firestore:", error);
        return {
            message: "Ocorreu um erro ao salvar a refeição no banco de dados. Verifique sua conexão e tente novamente.",
            errors: null,
            success: false,
        }
    }
}
