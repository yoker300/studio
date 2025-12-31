'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a complete recipe from a name.
 *
 * @exportedFunctions:
 *   - `generateRecipe`:  A function that takes a recipe name and returns a structured recipe object.
 *
 * @exportedTypes:
 *   - `GenerateRecipeInput`: The input type for the `generateRecipe` function.
 *   - `GenerateRecipeOutput`: The output type for the `generateRecipe` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to generate.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
    name: z.string().describe('The name of the recipe.'),
    icon: z.string().describe('An emoji icon for the recipe.'),
    ingredients: z.array(
        z.object({
            name: z.string().describe('The name of the ingredient.'),
            qty: z.number().optional().describe('The quantity of the ingredient.'),
            notes: z.string().optional().describe("A short note about the ingredient, including units like 'cups', 'tbsp', 'diced', or 'to taste'."),
            icon: z.string().optional().describe('An emoji icon for the ingredient.'),
        })
    ),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const generateRecipePrompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `You are a shopping list assistant and expert chef. The user will provide a recipe name, and you will parse it to extract a JSON object containing the recipe name, a suitable emoji icon, and an array of common ingredients for that recipe. Use conservative quantities for a standard version of the recipe. For each ingredient, include the unit of measurement (e.g., "1 cup", "2 tbsp", "1/2 tsp") in the 'notes' field.
  
Recipe Name: {{{recipeName}}}`,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    const {output} = await generateRecipePrompt(input);
    return output!;
  }
);
