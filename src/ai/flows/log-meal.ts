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
  foodDescription: z.string().describe('A natural language description of a food item and its quantity (e.g., "2 eggs and 1 slice of bacon").'),
});
export type LogMealInput = z.infer<typeof LogMealInputSchema>;

const LogMealOutputSchema = z.object({
  name: z.string().describe("The name of the food item (e.g., 'Eggs and Bacon')."),
  calories: z.number().describe('Total calories in the meal.'),
  protein: z.number().describe('Total protein in grams in the meal.'),
  carbohydrates: z.number().describe('Total carbohydrates in grams in the meal.'),
  fat: z.number().describe('Total fat in grams in the meal.'),
});
export type LogMealOutput = z.infer<typeof LogMealOutputSchema>;

export async function logMeal(input: LogMealInput): Promise<LogMealOutput> {
  return logMealFlow(input);
}

const logMealPrompt = ai.definePrompt({
  name: 'logMealPrompt',
  input: { schema: LogMealInputSchema },
  output: { schema: LogMealOutputSchema },
  prompt: `You are an expert nutritionist. Analyze the following food description and provide the estimated nutritional information.

Food Description: {{{foodDescription}}}

Based on this, provide the following information:
- The name of the meal.
- The total calories.
- The total protein in grams.
- The total carbohydrates in grams.
- The total fat in grams.

Return the data in a structured JSON format.`,
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