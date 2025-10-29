'use server';

/**
 * @fileOverview Projects a weight loss timeline based on user data and provides personalized tips.
 *
 * - projectWeightLossTimeline - A function that projects the weight loss timeline.
 * - ProjectWeightLossTimelineInput - The input type for the projectWeightLossTimeline function.
 * - ProjectWeightLossTimelineOutput - The return type for the projectWeightLossTimeline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ProjectWeightLossTimelineInputSchema = z.object({
  currentWeight: z.number().describe('The current weight of the user in kilograms.'),
  goalWeight: z.number().describe('The desired weight of the user in kilograms.'),
  goalTimelineWeeks: z.number().describe('The number of weeks the user wants to take to reach their goal.'),
  weeklyWeightChange: z.number().optional().describe('The average weekly weight change of the user.'),
  activityLevel: z.string().describe('The activity level of the user (sedentary, lightly active, moderately active, very active, extra active).'),
  dietaryPreferences: z.string().describe('The dietary preferences of the user (e.g., vegetarian, vegan, keto).'),
  age: z.number().describe('The age of the user in years.'),
  gender: z.string().describe('The gender of the user (male, female, other).'),
  height: z.number().describe('The height of the user in centimeters.'),
});
export type ProjectWeightLossTimelineInput = z.infer<typeof ProjectWeightLossTimelineInputSchema>;

const ProjectWeightLossTimelineOutputSchema = z.object({
  requiredWeeklyDeficit: z.number().describe('The required weekly calorie deficit to reach the goal in the specified timeline.'),
  recommendedDailyCalories: z.number().describe('The recommended daily calorie intake to achieve the goal.'),
  personalizedTips: z.string().describe('Personalized tips for the user to help them reach their goal, in Brazilian Portuguese, summarized in max 5 lines.'),
});
export type ProjectWeightLossTimelineOutput = z.infer<typeof ProjectWeightLossTimelineOutputSchema>;

export async function projectWeightLossTimeline(
  input: ProjectWeightLossTimelineInput
): Promise<ProjectWeightLossTimelineOutput> {
  return projectWeightLossTimelineFlow(input);
}

const projectWeightLossTimelinePrompt = ai.definePrompt({
  name: 'projectWeightLossTimelinePrompt',
  input: {schema: ProjectWeightLossTimelineInputSchema},
  output: {schema: ProjectWeightLossTimelineOutputSchema},
  prompt: `Você é um coach especialista em emagrecimento. Você irá calcular o déficit calórico semanal necessário e a ingestão diária de calorias recomendada para que um usuário atinja sua meta de peso em um número especificado de semanas, e fornecerá dicas personalizadas.

  Aqui estão as informações sobre o usuário:
  - Peso atual: {{currentWeight}} kg
  - Meta de peso: {{goalWeight}} kg
  - Prazo desejado: {{goalTimelineWeeks}} semanas
  {{#if weeklyWeightChange}}- Mudança média de peso semanal: {{weeklyWeightChange}} kg{{/if}}
  - Nível de atividade: {{activityLevel}}
  - Preferências alimentares: {{dietaryPreferences}}
  - Idade: {{age}} anos
  - Gênero: {{gender}}
  - Altura: {{height}} cm

  **Cálculos:**
  1.  **Taxa Metabólica Basal (TMB)**: Use a equação de Mifflin-St Jeor.
      - Para homens: TMB = 10 * peso (kg) + 6.25 * altura (cm) - 5 * idade (anos) + 5
      - Para mulheres: TMB = 10 * peso (kg) + 6.25 * altura (cm) - 5 * idade (anos) - 161
  2.  **Gasto Energético Diário Total (GET)**: Multiplique a TMB pelo fator de atividade.
      - Sedentário: 1.2
      - Levemente ativo: 1.375
      - Moderadamente ativo: 1.55
      - Muito ativo: 1.725
      - Extremamente ativo: 1.9
  3.  **Déficit Semanal Necessário**: Calcule o déficit calórico semanal para atingir a meta.
      - Assuma que 1 kg de gordura equivale a 7700 calorias.
      - Déficit total = (peso atual - meta de peso) * 7700
      - Déficit semanal = Déficit total / goalTimelineWeeks
  4.  **Ingestão Diária Recomendada**: Calcule a meta de calorias diárias.
      - Déficit diário = Déficit semanal / 7
      - Ingestão diária recomendada = GET - Déficit diário

  **Saída:**
  - Calcule o \`requiredWeeklyDeficit\` e o \`recommendedDailyCalories\`.
  - Forneça dicas personalizadas em **português do Brasil**, resumidas em no máximo 5 linhas.

  Sua resposta deve estar no seguinte formato JSON:
  {
    "requiredWeeklyDeficit": <number>,
    "recommendedDailyCalories": <number>,
    "personalizedTips": "<string em português do Brasil e resumida>"
  }`,
});

const projectWeightLossTimelineFlow = ai.defineFlow(
  {
    name: 'projectWeightLossTimelineFlow',
    inputSchema: ProjectWeightLossTimelineInputSchema,
    outputSchema: ProjectWeightLossTimelineOutputSchema,
  },
  async input => {
    const {output} = await projectWeightLossTimelinePrompt(input);
    return output!;
  }
);
