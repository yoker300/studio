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
import { GenerateRecipeInput, GenerateRecipeOutput } from '@/lib/types';


const GenerateRecipeInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to generate.'),
});


const GenerateRecipeOutputSchema = z.object({
    name: z.string().describe('The name of the recipe.'),
    icon: z.string().describe('An emoji icon for the recipe.'),
    ingredients: z.array(
        z.object({
            name: z.string().describe('The name of the ingredient.'),
            qty: z.number().optional().describe('The quantity of the ingredient.'),
            unit: z.string().optional().describe("The unit of measurement for the quantity (e.g., 'g', 'ml', 'cups')."),
            notes: z.string().optional().describe("Additional preparation notes (e.g., 'diced', 'melted', 'to taste'). Do NOT include the quantity or unit in this field."),
            icon: z.string().optional().describe('An emoji icon for the ingredient.'),
        })
    ),
});


export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const generateRecipePrompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `You are a shopping list assistant and expert chef. The user will provide a recipe name, and you will parse it to extract a JSON object containing the recipe name, a suitable emoji icon, and an array of common ingredients for that recipe. Use conservative quantities for a standard version of the recipe. For each ingredient, provide the numeric quantity in the 'qty' field, the unit of measurement (e.g., "cups", "tbsp") in the 'unit' field, and any preparation notes (e.g., "diced") in the 'notes' field. The 'notes' and 'unit' fields should NOT contain numbers.
  
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
