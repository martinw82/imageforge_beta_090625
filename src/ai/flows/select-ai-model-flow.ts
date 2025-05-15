
'use server';

/**
 * @fileOverview Allows users to select an AI model and adjust parameters for image generation.
 *
 * - selectAiModel - A function to select an AI model and its parameters.
 * - SelectAiModelInput - The input type for the selectAiModel function.
 * - SelectAiModelOutput - The return type for the selectAiModel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Updated to only expect the main prompt, as other parameters are embedded.
const SelectAiModelInputSchema = z.object({
  prompt: z.string().describe('The comprehensive text prompt for image generation, including all consistency rules and scene details.'),
});
export type SelectAiModelInput = z.infer<typeof SelectAiModelInputSchema>;

const SelectAiModelOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
  altText: z.string().describe('Alternative text for the generated image, usually the full prompt used.'),
});
export type SelectAiModelOutput = z.infer<typeof SelectAiModelOutputSchema>;

export async function selectAiModel(input: SelectAiModelInput): Promise<SelectAiModelOutput> {
  return selectAiModelFlow(input);
}

// This prompt definition is for schema validation and documentation.
// The actual generation uses input.prompt directly.
const selectAiModelPrompt = ai.definePrompt({
  name: 'selectAiModelPrompt',
  input: {schema: SelectAiModelInputSchema},
  output: {schema: SelectAiModelOutputSchema},
  prompt: `Generate an image based on the following detailed prompt: {{{prompt}}}\n\nEnsure the image is appropriate and adheres to all instructions in the main prompt.`,
});

const selectAiModelFlow = ai.defineFlow(
  {
    name: 'selectAiModelFlow',
    inputSchema: SelectAiModelInputSchema,
    outputSchema: SelectAiModelOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Fixed model for image generation
      prompt: input.prompt, // The main prompt content from the frontend
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Required for image generation
      },
    });

    return {
      imageUrl: media.url,
      altText: input.prompt, // Alt text is the full prompt used
    };
  }
);
