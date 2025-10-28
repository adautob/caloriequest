'use server';

/**
 * @fileOverview Projects a weight loss timeline based on user data and provides personalized tips.
 *
 * - projectWeightLossTimeline - A function that projects the weight loss timeline.
 * - ProjectWeightLossTimelineInput - The input type for the projectWeightLossTimeline function.
 * - ProjectWeightLossTimelineOutput - The return type for the projectWeightLossTimeline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectWeightLossTimelineInputSchema = z.object({
  currentWeight: z.number().describe('The current weight of the user in kilograms.'),
  goalWeight: z.number().describe('The desired weight of the user in kilograms.'),
  weeklyCalorieDeficit: z.number().describe('The average weekly calorie deficit of the user.'),
  weeklyWeightChange: z.number().optional().describe('The average weekly weight change of the user.'),
  activityLevel: z.string().describe('The activity level of the user (sedentary, lightly active, moderately active, very active, extra active).'),
  dietaryPreferences: z.string().describe('The dietary preferences of the user (e.g., vegetarian, vegan, keto).'),
  age: z.number().describe('The age of the user in years.'),
  gender: z.string().describe('The gender of the user (male, female, other).'),
  height: z.number().describe('The height of the user in centimeters.'),
});
export type ProjectWeightLossTimelineInput = z.infer<typeof ProjectWeightLossTimelineInputSchema>;

const ProjectWeightLossTimelineOutputSchema = z.object({
  projectedTimelineWeeks: z.number().describe('The projected number of weeks to reach the goal weight.'),
  personalizedTips: z.string().describe('Personalized tips for the user to help them reach their goal.'),
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
  prompt: `You are an expert weight loss coach. You will project a timeline for the user to reach their weight loss goal, and provide personalized tips.

  Here is information about the user:
  - Current weight: {{currentWeight}} kg
  - Goal weight: {{goalWeight}} kg
  - Weekly calorie deficit: {{weeklyCalorieDeficit}} calories
  {{#if weeklyWeightChange}}- Average weekly weight change: {{weeklyWeightChange}} kg{{/if}}
  - Activity level: {{activityLevel}}
  - Dietary preferences: {{dietaryPreferences}}
  - Age: {{age}} years
  - Gender: {{gender}}
  - Height: {{height}} cm

  Based on this information, project the number of weeks it will take for the user to reach their goal weight. Take into account that 1 kg of fat is approximately 7700 calories.

  Also, provide personalized tips for the user to help them reach their goal, taking into account their activity level and dietary preferences.

  Your response should be in the following format:
  {
    "projectedTimelineWeeks": <number>,
    "personalizedTips": <string>
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
