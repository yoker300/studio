'use server';

/**
 * @fileOverview This file defines a Genkit flow for processing a shopping list item.
 * It translates the item name to a canonical English name, corrects spelling,
 * assigns it to a fixed category, and selects an appropriate emoji icon.
 *
 * This file exports a single function, `processItem`, which is a server action
 * that takes an item name and returns its processed details.
 * The input and output types (`ProcessItemInput`, `ProcessItemOutput`) are defined
 * in `src/lib/types.ts`.
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
});


const ProcessItemOutputSchema = z.object({
  name: z.string().describe('The corrected, original-language name of the item.'),
  canonicalName: z.string().describe('The standardized, canonical English name for the item.'),
  category: z.string().describe(`The category of the item, chosen from the following fixed list: ${CATEGORY_LIST.join(', ')}`),
  icon: z.string().describe('A single emoji icon that best represents the item.'),
});


export async function processItem(input: ProcessItemInput): Promise<ProcessItemOutput> {
  return processItemFlow(input);
}

const processItemPrompt = ai.definePrompt({
  name: 'processItemPrompt',
  input: {schema: ProcessItemInputSchema},
  output: {schema: ProcessItemOutputSchema},
  prompt: `You are an expert shopping list assistant. Given an item name, you will process it and respond with a JSON object.
The item name might be misspelled or in a language other than English.

Your task is to:
1.  If the name is not in English, translate it to determine the item, but keep the original name in the 'name' field (with spelling corrected if necessary).
2.  Provide a standardized, "canonical" English name for the item in the 'canonicalName' field. For example, if the input is "מלפפון" or "cucumbr", the canonicalName should be "Cucumber".
3.  Assign a category to the item from this exact list: ${CATEGORY_LIST.join(', ')}. Do not use any other category.
4.  Choose a single, appropriate emoji for the 'icon' field.

Respond ONLY with the JSON object.

Item name: {{{name}}}`,
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
