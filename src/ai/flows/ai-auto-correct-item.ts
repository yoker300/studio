'use server';

/**
 * @fileOverview This file defines a Genkit flow for automatically correcting item spelling,
 * assigning the correct emoji icon, and categorizing items using AI.
 *
 * @exportedFunctions:
 *   - `autoCorrectItem`:  A function that takes an item's name, and attempts to auto-correct
 *      its spelling and assign a relevant emoji icon and category.
 *
 * @exportedTypes:
 *   - `AutoCorrectItemInput`: The input type for the `autoCorrectItem` function, containing the item name.
 *   - `AutoCorrectItemOutput`: The output type for the `autoCorrectItem` function, containing the corrected item data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCorrectItemInputSchema = z.object({
  name: z.string().describe('The name of the item to auto-correct.'),
});
export type AutoCorrectItemInput = z.infer<typeof AutoCorrectItemInputSchema>;

const AutoCorrectItemOutputSchema = z.object({
  name: z.string().describe('The corrected name of the item.'),
  category: z.string().describe('The category of the item.'),
  icon: z.string().describe('An emoji icon representing the item.'),
});
export type AutoCorrectItemOutput = z.infer<typeof AutoCorrectItemOutputSchema>;

export async function autoCorrectItem(input: AutoCorrectItemInput): Promise<AutoCorrectItemOutput> {
  return autoCorrectItemFlow(input);
}

const autoCorrectItemPrompt = ai.definePrompt({
  name: 'autoCorrectItemPrompt',
  input: {schema: AutoCorrectItemInputSchema},
  output: {schema: AutoCorrectItemOutputSchema},
  prompt: `You are a shopping list assistant.  Given an item name, you will respond with a JSON object containing the corrected item name, a category for the item, and an emoji icon representing the item.  Respond ONLY with the JSON object.

Item name: {{{name}}}`,
});

const autoCorrectItemFlow = ai.defineFlow(
  {
    name: 'autoCorrectItemFlow',
    inputSchema: AutoCorrectItemInputSchema,
    outputSchema: AutoCorrectItemOutputSchema,
  },
  async input => {
    const {output} = await autoCorrectItemPrompt(input);
    return output!;
  }
);
