'use server';

/**
 * @fileOverview This file defines a Genkit flow for processing a shopping list item.
 * It translates the item name, corrects spelling, assigns a category, selects an icon,
 * and converts its quantity to a standard base unit (grams or milliliters).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ProcessItemInput, ProcessItemOutput } from '@/lib/types';

const CATEGORY_LIST = [
  'Fruits', 'Vegetables', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery', 'Pantry',
  'Frozen Foods', 'Beverages', 'Snacks', 'Household', 'Personal Care',
  'Baby', 'Pets', 'Other'
];

const ProcessItemInputSchema = z.object({
  name: z.string().describe('The name of the item to process, which could be in any language.'),
  qty: z.number().describe('The current quantity of the item.'),
  unit: z.string().optional().describe('The current unit of the item (e.g., "cup", "tbsp", "oz").'),
});

const ProcessItemOutputSchema = z.object({
  name: z.string().describe('The corrected, original-language name of the item.'),
  canonicalName: z.string().describe('The standardized, canonical English name for the item.'),
  category: z.string().describe(`The category of the item, chosen from the following fixed list: ${CATEGORY_LIST.join(', ')}`),
  icon: z.string().describe('A single emoji icon that best represents the item.'),
  qty: z.number().describe('The converted quantity in the base unit (if conversion was possible).'),
  unit: z.string().optional().describe("The base unit ('g' or 'ml') or the original unit if conversion was not possible."),
});

export async function processItem(input: ProcessItemInput): Promise<ProcessItemOutput> {
  return processItemFlow(input);
}

const processItemPrompt = ai.definePrompt({
  name: 'processItemPrompt',
  input: {schema: ProcessItemInputSchema},
  output: {schema: ProcessItemOutputSchema},
  prompt: `You are an expert kitchen scientist and shopping list assistant. Given an item name, quantity, and unit, you will process it and respond with a JSON object.

Your task is to:
1.  Correct any misspellings in the original name but keep it in the 'name' field. If it's not in English, determine the item but keep the original name.
2.  Provide a standardized, canonical English name in the 'canonicalName' field.
3.  Assign a category from this exact list: ${CATEGORY_LIST.join(', ')}.
4.  Choose a single, appropriate emoji for the 'icon' field.
5.  **Convert the quantity to a standard base unit.**
    - If the item is a SOLID (like flour, sugar, butter), convert its quantity to GRAMS (g).
    - If the item is a LIQUID (like water, milk, oil), convert its quantity to MILLILITERS (ml).
    - Use your scientific knowledge for accurate conversions (e.g., 1 cup of flour is ~120g, 1 cup of sugar is ~200g).
    - If a unit is already a base unit (g, ml), just return the original quantity and standardized unit.
    - If the input has no unit or an ambiguous unit (e.g., 'a pinch', 'slices'), return the original quantity and unit. In this case, the 'unit' field in the output should be the same as the input.

Respond ONLY with the JSON object.

Item name: {{{name}}}
Quantity: {{{qty}}}
Unit: {{{unit}}}
`,
});

const processItemFlow = ai.defineFlow(
  {
    name: 'processItemFlow',
    inputSchema: ProcessItemInputSchema,
    outputSchema: ProcessItemOutputSchema,
  },
  async input => {
    const {output} = await processItemPrompt(input);
    return output!;
  }
);
