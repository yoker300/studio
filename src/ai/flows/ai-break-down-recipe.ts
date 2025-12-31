'use server';

/**
 * @fileOverview This file defines a Genkit flow for breaking down a recipe name into a list of ingredients.
 *
 * @exportedFunctions:
 *   - `breakDownRecipe`:  A function that takes a recipe name and returns a list of ingredients.
 *
 * @exportedTypes:
 *   - `BreakDownRecipeInput`: The input type for the `breakDownRecipe` function.
 *   - `BreakDownRecipeOutput`: The output type for the `breakDownRecipe` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BreakDownRecipeInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to break down into ingredients.'),
});
export type BreakDownRecipeInput = z.infer<typeof BreakDownRecipeInputSchema>;

const BreakDownRecipeOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the ingredient.'),
    qty: z.number().optional().describe('The quantity of the ingredient.'),
    category: z.string().optional().describe('The category of the ingredient.'),
    urgent: z.boolean().optional().describe('Whether the ingredient is urgent.'),
    icon: z.string().optional().describe('An emoji icon for the ingredient.'),
  })
);
export type BreakDownRecipeOutput = z.infer<typeof BreakDownRecipeOutputSchema>;

export async function breakDownRecipe(input: BreakDownRecipeInput): Promise<BreakDownRecipeOutput> {
  return breakDownRecipeFlow(input);
}

const breakDownRecipePrompt = ai.definePrompt({
  name: 'breakDownRecipePrompt',
  input: {schema: BreakDownRecipeInputSchema},
  output: {schema: BreakDownRecipeOutputSchema},
  prompt: `You are a shopping list assistant and expert chef. The user will provide a recipe name, and you will parse it to extract a JSON array of common ingredients for that recipe. Use conservative quantities for a standard version of the recipe.
  
Recipe Name: {{{recipeName}}}`,
});

const breakDownRecipeFlow = ai.defineFlow(
  {
    name: 'breakDownRecipeFlow',
    inputSchema: BreakDownRecipeInputSchema,
    outputSchema: BreakDownRecipeOutputSchema,
  },
  async input => {
    const {output} = await breakDownRecipePrompt(input);
    return output!;
  }
);
