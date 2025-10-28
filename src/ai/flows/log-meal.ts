'use server';
/**
 * @fileOverview Processes a natural language description of a food item and returns its nutritional information.
 *
 * - logMeal - A function that handles processing the food description.
 * - LogMealInput - The input type for the logMeal function.
 * - LogMealOutput - The return type for the logMeal function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LogMealInputSchema = z.object({
  foodDescription: z.string().describe('A natural language description of a food item and its quantity (e.g., "2 ovos e 1 fatia de bacon").'),
});
export type LogMealInput = z.infer<typeof LogMealInputSchema>;

const LogMealOutputSchema = z.object({
  name: z.string().describe("O nome do item alimentar em português (ex: 'Ovos com Bacon')."),
  calories: z.number().describe('Total de calorias na refeição.'),
  protein: z.number().describe('Total de proteína em gramas na refeição.'),
  carbohydrates: z.number().describe('Total de carboidratos em gramas na refeição.'),
  fat: z.number().describe('Total de gordura em gramas na refeição.'),
});
export type LogMealOutput = z.infer<typeof LogMealOutputSchema>;

export async function logMeal(input: LogMealInput): Promise<LogMealOutput> {
  return logMealFlow(input);
}

const logMealPrompt = ai.definePrompt({
  name: 'logMealPrompt',
  input: { schema: LogMealInputSchema },
  output: { schema: LogMealOutputSchema },
  prompt: `Você é um nutricionista especialista. Analise a seguinte descrição de alimento e forneça as informações nutricionais estimadas. O nome da refeição deve estar em português do Brasil.

Descrição do Alimento: {{{foodDescription}}}

Com base nisso, forneça as seguintes informações:
- O nome da refeição em português do Brasil.
- O total de calorias.
- O total de proteína em gramas.
- O total de carboidratos em gramas.
- O total de gordura em gramas.

Retorne os dados em um formato JSON estruturado.`,
});

const logMealFlow = ai.defineFlow(
  {
    name: 'logMealFlow',
    inputSchema: LogMealInputSchema,
    outputSchema: LogMealOutputSchema,
  },
  async input => {
    const { output } = await logMealPrompt(input);
    return output!;
  }
);
