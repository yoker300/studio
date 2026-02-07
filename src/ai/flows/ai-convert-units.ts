'use server';

/**
 * @fileOverview Defines a Genkit flow for converting ingredient quantities to a standard base unit.
 *
 * @exportedFunctions:
 *   - `convertUnits`: A function that takes an ingredient's details and returns its quantity in a base unit (grams or milliliters).
 *
 * @exportedTypes:
 *   - `ConvertUnitsInput`: The input type for the `convertUnits` function.
 *   - `ConvertUnitsOutput`: The output type for the `convertUnits` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConvertUnitsInputSchema = z.object({
  name: z.string().describe('The name of the ingredient.'),
  qty: z.number().describe('The current quantity of the ingredient.'),
  unit: z.string().optional().describe('The current unit of the ingredient (e.g., "cup", "tbsp", "oz").'),
});
export type ConvertUnitsInput = z.infer<typeof ConvertUnitsInputSchema>;

const ConvertUnitsOutputSchema = z.object({
  qty: z.number().optional().describe('The converted quantity in the base unit.'),
  unit: z.string().optional().describe('The base unit, either "g" for solids or "ml" for liquids.'),
  error: z.string().optional().describe('An error message if the conversion could not be performed.'),
});
export type ConvertUnitsOutput = z.infer<typeof ConvertUnitsOutputSchema>;


export async function convertUnits(input: ConvertUnitsInput): Promise<ConvertUnitsOutput> {
    return convertUnitsFlow(input);
}

const convertUnitsPrompt = ai.definePrompt({
    name: 'convertUnitsPrompt',
    input: { schema: ConvertUnitsInputSchema },
    output: { schema: ConvertUnitsOutputSchema },
    prompt: `You are an expert kitchen scientist specializing in food density and measurements. Your task is to convert a given ingredient quantity into a standard base unit.
- If the ingredient is a SOLID (like flour, sugar, butter, chopped vegetables), convert its quantity to GRAMS (g).
- If the ingredient is a LIQUID (like water, milk, oil), convert its quantity to MILLILITERS (ml).

Use your scientific knowledge for accurate conversions. For example, 1 cup of flour is ~120g, but 1 cup of sugar is ~200g.
- If a unit is already a base unit (g, grams, ml, milliliters), just return the original quantity and the standardized unit ('g' or 'ml').
- If the unit is a standard convertible unit (e.g., 'cup', 'oz', 'lb', 'kg', 'tbsp', 'tsp'), perform the conversion.
- If the input has no unit or the unit is ambiguous/non-standard (e.g., 'a pinch', 'to taste', 'pieces', 'slices'), set the 'error' field explaining why it cannot be converted.

Ingredient Name: {{{name}}}
Quantity: {{{qty}}}
Unit: {{{unit}}}
`,
});


const convertUnitsFlow = ai.defineFlow(
  {
    name: 'convertUnitsFlow',
    inputSchema: ConvertUnitsInputSchema,
    outputSchema: ConvertUnitsOutputSchema,
  },
  async (input) => {
    // If no unit is provided, it cannot be converted.
    if (!input.unit) {
        return { error: "No unit provided." };
    }
    const { output } = await convertUnitsPrompt(input);
    return output!;
  }
);
