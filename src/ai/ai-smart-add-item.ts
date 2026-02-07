'use server';

/**
 * @fileOverview An AI agent for parsing voice input to add multiple items to a shopping list.
 *
 * - smartAddItem - A function that handles parsing voice input to extract item details.
 * - SmartAddItemInput - The input type for the smartAddItem function.
 * - SmartAddItemOutput - The return type for the smartAddItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SmartAddItemInput, SmartAddItemOutput } from '@/lib/types';

const SmartAddItemInputSchema = z.object({
  voiceInput: z
    .string()
    .describe('Voice input containing a list of items to add to the shopping list.'),
});

const SmartAddItemOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the item.'),
    canonicalName: z.string().optional().describe('The standardized, canonical English name for the item.'),
    qty: z.number().optional().describe('The quantity of the item.'),
    category: z.string().optional().describe('The category of the item.'),
    urgent: z.boolean().optional().describe('Whether the item is urgent.'),
    icon: z.string().optional().describe('The icon for the item.'),
  })
);

export async function smartAddItem(input: SmartAddItemInput): Promise<SmartAddItemOutput> {
  return smartAddItemFlow(input);
}

const smartAddItemPrompt = ai.definePrompt({
  name: 'smartAddItemPrompt',
  input: {schema: SmartAddItemInputSchema},
  output: {schema: SmartAddItemOutputSchema},
  prompt: `You are a shopping list assistant. The user will provide voice input, and you will parse it to extract a JSON array of items to add to the shopping list. Use conservative quantities. If no quantity is provided, assume the item is not urgent, and make a best guess at categorization based on the item name. For each item, provide a 'canonicalName' which is the standardized English name.

Voice Input: {{{voiceInput}}}`,
});

const smartAddItemFlow = ai.defineFlow(
  {
    name: 'smartAddItemFlow',
    inputSchema: SmartAddItemInputSchema,
    outputSchema: SmartAddItemOutputSchema,
  },
  async input => {
    const {output} = await smartAddItemPrompt(input);
    return output!;
  }
);
