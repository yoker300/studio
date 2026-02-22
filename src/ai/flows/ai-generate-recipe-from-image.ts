'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a recipe from an image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateRecipeOutput, GenerateRecipeFromImageInput } from '@/lib/types';

const GenerateRecipeFromImageInputSchema = z.object({
  imageDataUri: z.string().describe(
    "A photo of a recipe, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});

// Output schema can be reused from the other recipe generation flow
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

export async function generateRecipeFromImage(input: GenerateRecipeFromImageInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFromImageFlow(input);
}

const generateRecipeFromImagePrompt = ai.definePrompt({
  name: 'generateRecipeFromImagePrompt',
  input: {schema: GenerateRecipeFromImageInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `You are a shopping list assistant and expert chef. The user has provided a photo of a recipe. Analyze the image to extract the recipe's name and its ingredients.
  
Your task is to parse the image content and create a structured JSON object containing the recipe name, a suitable emoji icon, and an array of ingredients.
  
For each ingredient, provide:
- The name of the ingredient.
- The numeric quantity in the 'qty' field.
- The unit of measurement (e.g., "cups", "tbsp") in the 'unit' field.
- Any preparation notes (e.g., "diced", "finely chopped") in the 'notes' field.
- The 'notes' and 'unit' fields should NOT contain numbers.
- If quantity is not specified, make a reasonable guess.

Recipe Image: {{media url=imageDataUri}}`,
});

const generateRecipeFromImageFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromImageFlow',
    inputSchema: GenerateRecipeFromImageInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    const {output} = await generateRecipeFromImagePrompt(input);
    return output!;
  }
);
