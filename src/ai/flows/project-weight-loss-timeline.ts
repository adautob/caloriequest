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
  prompt: `You are an expert weight loss coach. You will calculate the required weekly calorie deficit for a user to reach their weight loss goal in a specified number of weeks and provide personalized tips.

  Here is information about the user:
  - Current weight: {{currentWeight}} kg
  - Goal weight: {{goalWeight}} kg
  - Desired timeline: {{goalTimelineWeeks}} weeks
  {{#if weeklyWeightChange}}- Average weekly weight change: {{weeklyWeightChange}} kg{{/if}}
  - Activity level: {{activityLevel}}
  - Dietary preferences: {{dietaryPreferences}}
  - Age: {{age}} years
  - Gender: {{gender}}
  - Height: {{height}} cm

  Based on this information, calculate the required weekly calorie deficit to reach the goal weight in the specified timeline. Assume that 1 kg of fat is approximately 7700 calories. The total weight to lose is (currentWeight - goalWeight). The total calorie deficit needed is (total weight to lose * 7700). The required weekly deficit is (total calorie deficit / goalTimelineWeeks).

  Also, provide personalized tips for the user to help them reach their goal, taking into account their activity level and dietary preferences. The tips should be encouraging and actionable.

  Your response should be in the following format:
  {
    "requiredWeeklyDeficit": <number>,
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
