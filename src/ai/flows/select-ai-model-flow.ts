
// SelectAIModel story implementation.
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

const SelectAiModelInputSchema = z.object({
  modelName: z.string().describe('The name of the AI model to use (e.g., DALL-E, Gemini).'),
  imageSize: z.string().optional().describe('The desired image size (e.g., 1024x1024).'),
  style: z.string().optional().describe('The desired image style (e.g., realistic, artistic).'),
  prompt: z.string().describe('The text prompt for image generation.'),
});
export type SelectAiModelInput = z.infer<typeof SelectAiModelInputSchema>;

const SelectAiModelOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
  altText: z.string().describe('Alternative text for the generated image'),
});
export type SelectAiModelOutput = z.infer<typeof SelectAiModelOutputSchema>;

export async function selectAiModel(input: SelectAiModelInput): Promise<SelectAiModelOutput> {
  return selectAiModelFlow(input);
}

const selectAiModelPrompt = ai.definePrompt({
  name: 'selectAiModelPrompt',
  input: {schema: SelectAiModelInputSchema},
  output: {schema: SelectAiModelOutputSchema},
  prompt: `Generate an image based on the following prompt, using the specified model and parameters:\n\nPrompt: {{{prompt}}}\nModel: {{{modelName}}}\nImage Size: {{{imageSize}}}\nStyle: {{{style}}}\n\nEnsure the image is appropriate based on the prompt.`,
});

const selectAiModelFlow = ai.defineFlow(
  {
    name: 'selectAiModelFlow',
    inputSchema: SelectAiModelInputSchema,
    outputSchema: SelectAiModelOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-exp',

      prompt: input.prompt,

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {
      imageUrl: media.url,
      altText: input.prompt,
    };
  }
);
