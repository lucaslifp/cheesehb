'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting upsell items based on the user's current order.
 *
 * - upsellSuggestion - A function that takes user and order information and suggests an upsell item.
 * - UpsellSuggestionInput - The input type for the upsellSuggestion function.
 * - UpsellSuggestionOutput - The return type for the upsellSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UpsellSuggestionInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  phoneNumber: z.string().describe('The phone number of the user.'),
  orderSummary: z.string().describe('A summary of the current order, including items and quantities.'),
  orderTotal: z.number().describe('The total value of the current order.'),
  deliveryAddress: z.string().optional().describe('The delivery address of the user, if applicable.'),
});
export type UpsellSuggestionInput = z.infer<typeof UpsellSuggestionInputSchema>;

const UpsellSuggestionOutputSchema = z.object({
  suggestion: z.string().describe('A suggestion for an upsell item (drink, side, or dessert) that complements the order.'),
  reason: z.string().describe('The reason why this item is suggested, based on the order and user information.'),
});
export type UpsellSuggestionOutput = z.infer<typeof UpsellSuggestionOutputSchema>;

export async function upsellSuggestion(input: UpsellSuggestionInput): Promise<UpsellSuggestionOutput> {
  return upsellSuggestionFlow(input);
}

const upsellSuggestionPrompt = ai.definePrompt({
  name: 'upsellSuggestionPrompt',
  input: {schema: UpsellSuggestionInputSchema},
  output: {schema: UpsellSuggestionOutputSchema},
  prompt: `You are a helpful assistant in a pizza shop, and are responsible for suggesting upsell items to customers.

  Based on the customer's current order and information, suggest ONE additional item (drink, side, or dessert) that would complement their meal. Explain why you are suggesting this item.

  Customer Name: {{{userName}}}
  Phone Number: {{{phoneNumber}}}
  Order Summary: {{{orderSummary}}}
  Order Total: {{{orderTotal}}}
  Delivery Address: {{{deliveryAddress}}}

  Suggestion:`,
});

const upsellSuggestionFlow = ai.defineFlow(
  {
    name: 'upsellSuggestionFlow',
    inputSchema: UpsellSuggestionInputSchema,
    outputSchema: UpsellSuggestionOutputSchema,
  },
  async input => {
    const {output} = await upsellSuggestionPrompt(input);
    return output!;
  }
);
