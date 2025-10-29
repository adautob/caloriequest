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
  prompt: `Você é um coach especialista em emagrecimento. Você irá calcular o déficit calórico semanal necessário para que um usuário atinja sua meta de peso em um número especificado de semanas e fornecerá dicas personalizadas.

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

  Com base nessas informações, calcule o déficit calórico semanal necessário para atingir a meta de peso no prazo especificado. Assuma que 1 kg de gordura equivale a aproximadamente 7700 calorias. O peso total a perder é (peso atual - meta de peso). O déficit calórico total necessário é (peso total a perder * 7700). O déficit semanal necessário é (déficit calórico total / goalTimelineWeeks).

  Além disso, forneça dicas personalizadas para o usuário o ajudar a atingir seu objetivo, levando em consideração seu nível de atividade e preferências alimentares. As dicas devem ser encorajadoras, práticas, **resumidas em no máximo 5 linhas** e **obrigatoriamente em português do Brasil**.

  Sua resposta deve estar no seguinte formato JSON:
  {
    "requiredWeeklyDeficit": <number>,
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
