'use server';

/**
 * @fileOverview Generates a personalized daily tip for the user.
 *
 * - getDailyTip - Generates a daily tip.
 * - GetDailyTipInput - The input type for the getDailyTip function.
 * - GetDailyTipOutput - The return type for the getDailyTip function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetDailyTipInputSchema = z.object({
  currentWeight: z.number().optional().describe('The current weight of the user in kilograms.'),
  goalWeight: z.number().optional().describe('The desired weight of the user in kilograms.'),
  activityLevel: z.string().optional().describe('The activity level of the user.'),
  dietaryPreferences: z.string().optional().describe('The dietary preferences of the user.'),
  name: z.string().optional().describe('The name of the user.'),
});

export type GetDailyTipInput = z.infer<typeof GetDailyTipInputSchema>;

const GetDailyTipOutputSchema = z.object({
  tip: z.string().describe('A single, concise, personalized daily tip in Brazilian Portuguese.'),
});
export type GetDailyTipOutput = z.infer<typeof GetDailyTipOutputSchema>;

export async function getDailyTip(
  input: GetDailyTipInput
): Promise<GetDailyTipOutput> {
  return getDailyTipFlow(input);
}

const getDailyTipPrompt = ai.definePrompt({
  name: 'getDailyTipPrompt',
  input: { schema: GetDailyTipInputSchema },
  output: { schema: GetDailyTipOutputSchema },
  prompt: `Você é um coach de saúde e bem-estar. Crie uma dica diária, curta, motivacional e personalizada para o usuário com base em seus dados. A dica deve ser em português do Brasil.

  Dados do usuário:
  {{#if name}}- Nome: {{name}}{{/if}}
  {{#if currentWeight}}- Peso Atual: {{currentWeight}} kg{{/if}}
  {{#if goalWeight}}- Meta de Peso: {{goalWeight}} kg{{/if}}
  {{#if activityLevel}}- Nível de Atividade: {{activityLevel}}{{/if}}
  {{#if dietaryPreferences}}- Preferências: {{dietaryPreferences}}{{/if}}

  Exemplos de dicas:
  - "Olá {{name}}! Que tal adicionar 10 minutos de caminhada hoje? Pequenos passos levam a grandes resultados!"
  - "Lembre-se de beber bastante água hoje! A hidratação é sua aliada na jornada para os {{goalWeight}} kg."
  - "Com base no seu nível de atividade ({{activityLevel}}), um treino rápido de 15 minutos pode fazer maravilhas. Você consegue!"

  Gere uma nova dica curta e inspiradora. Seja criativo e evite repetir as mesmas dicas. A dica deve ser única e encorajadora.
  `,
});

const getDailyTipFlow = ai.defineFlow(
  {
    name: 'getDailyTipFlow',
    inputSchema: GetDailyTipInputSchema,
    outputSchema: GetDailyTipOutputSchema,
  },
  async input => {
    const { output } = await getDailyTipPrompt(input);
    return output!;
  }
);
