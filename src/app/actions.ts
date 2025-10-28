'use server';

import { projectWeightLossTimeline, ProjectWeightLossTimelineInput } from "@/ai/flows/project-weight-loss-timeline";
import { z } from "zod";

const formSchema = z.object({
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

type State = {
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
  prevState: State,
  formData: FormData,
): Promise<State> {
  const validatedFields = formSchema.safeParse(Object.fromEntries(formData.entries()));

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
