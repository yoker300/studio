'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a recipe from a URL.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateRecipeOutput, GenerateRecipeFromUrlInput } from '@/lib/types';

// A simple (and naive) fetch function.
async function fetchUrlContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const textContent = await response.text();
    return textContent;
}

const GenerateRecipeFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL of the recipe webpage.'),
});

const RecipeParsingInputSchema = z.object({
    pageContent: z.string().describe('The full text or HTML content of the recipe webpage.'),
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

export async function generateRecipeFromUrl(input: GenerateRecipeFromUrlInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFromUrlFlow(input);
}

const parseRecipePrompt = ai.definePrompt({
    name: 'parseRecipeFromWebContentPrompt',
    input: { schema: RecipeParsingInputSchema },
    output: { schema: GenerateRecipeOutputSchema },
    prompt: `You are an expert recipe parsing assistant. Below is the raw text content from a webpage. Your task is to find the recipe within this content and extract it into a structured JSON object.

Identify the recipe's name, and its list of ingredients.

For each ingredient, provide:
- The name of the ingredient.
- The numeric quantity in the 'qty' field.
- The unit of measurement (e.g., "cups", "tbsp") in the 'unit' field.
- Any preparation notes (e.g., "diced") in the 'notes' field.
- The 'notes' and 'unit' fields should NOT contain numbers.
- Also, provide a single suitable emoji 'icon' for the overall recipe.

Ignore all other text, ads, comments, and non-recipe information.

Webpage Content:
---
{{{pageContent}}}
---
`,
});

const generateRecipeFromUrlFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromUrlFlow',
    inputSchema: GenerateRecipeFromUrlInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async ({ url }) => {
    const pageContent = await fetchUrlContent(url);
    const { output } = await parseRecipePrompt({ pageContent });
    return output!;
  }
);
