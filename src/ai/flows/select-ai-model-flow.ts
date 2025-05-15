
'use server';

/**
 * @fileOverview Allows users to select an AI model and adjust parameters for image generation.
 *
 * - selectAiModel - A function to select an AI model and its parameters.
 * - SelectAiModelInput - The input type for the selectAiModel function.
 * - SelectAiModelOutput - The return type for the selectAiModel function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ai as globalAi } from '@/ai/genkit';
import { z } from 'genkit'; // Use Genkit's Zod for schema definition
import { ZodError } from 'zod'; // ZodError for specific error handling

const SelectAiModelInputSchema = z.object({
  prompt: z.string().describe('The comprehensive text prompt for image generation, including all consistency rules and scene details.'),
  apiKey: z.string().optional().describe('Optional Google AI API Key. If not provided, uses server configuration.'),
  referenceImageDataUri: z.string().optional().describe("Optional reference image as a data URI (e.g., 'data:image/png;base64,...'). If provided, this image will be used as context for generation."),
});
export type SelectAiModelInput = z.infer<typeof SelectAiModelInputSchema>;

const SelectAiModelOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
  altText: z.string().describe('Alternative text for the generated image, usually the full text prompt used.'),
});
export type SelectAiModelOutput = z.infer<typeof SelectAiModelOutputSchema>;

export async function selectAiModel(input: SelectAiModelInput): Promise<SelectAiModelOutput> {
  return selectAiModelFlow(input);
}

const selectAiModelPromptDefinition = globalAi.definePrompt({
  name: 'selectAiModelPrompt',
  input: { schema: SelectAiModelInputSchema },
  output: { schema: SelectAiModelOutputSchema },
  prompt: `Generate an image based on the following detailed text prompt: {{{prompt}}}.
{{#if referenceImageDataUri}}Use the provided image ({{media url=referenceImageDataUri}}) as a reference or starting point.{{/if}}
Ensure the image adheres to all instructions. If an apiKey is provided in the input, it should be considered for configuring the generation call.`,
});

const selectAiModelFlow = globalAi.defineFlow(
  {
    name: 'selectAiModelFlow',
    inputSchema: SelectAiModelInputSchema,
    outputSchema: SelectAiModelOutputSchema,
  },
  async (input) => {
    let clientToUse = globalAi;

    if (input.apiKey && input.apiKey.trim() !== "") {
      console.log("Attempting to use provided API key for image generation.");
      try {
        const dynamicClient = genkit({
          plugins: [googleAI({ apiKey: input.apiKey })],
        });
        clientToUse = dynamicClient;
      } catch (e: any) {
        console.error("Failed to initialize dynamic Genkit client with provided API key:", e);
        if (e instanceof ZodError) {
            throw new Error(`Invalid API key configuration: ${e.message}`);
        }
        throw new Error("Failed to configure AI client with the provided API key. Please check the key and try again.");
      }
    } else {
      console.log("Using server-configured API key for image generation (if available).");
    }

    try {
      let generationPrompt: string | Array<{ media: { url: string } } | { text: string }> = input.prompt;

      if (input.referenceImageDataUri) {
        // The main text prompt describes *what to do with* or *how to modify* the reference image,
        // or what new scene to place the character/logo from the reference image into.
        generationPrompt = [
          { media: { url: input.referenceImageDataUri } },
          { text: input.prompt }
        ];
      }

      const { media } = await clientToUse.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: generationPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error("The AI service did not return an image. This could be due to safety filters, an issue with the prompt, or an internal service error.");
      }

      return {
        imageUrl: media.url,
        // Alt text uses the text part of the prompt. If a reference image was used, input.prompt is the text part.
        altText: input.prompt,
      };
    } catch (error: any) {
        console.error("Error during image generation with selected client:", error);
        let errorMessage = "An unexpected error occurred during image generation.";
        if (error.message) {
            if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
                errorMessage = "The provided API key is not valid or is missing. Please check it and try again. For server-configured keys, ensure it's set correctly in the environment.";
            } else if (error.message.includes("quotaExceeded") || error.message.includes("billing account")) {
                errorMessage = "API quota exceeded or a billing issue occurred. Please check your Google AI account status and billing settings.";
            } else if (error.message.includes("permission denied") || error.message.includes("IAM")) {
                 errorMessage = "Permission denied. The API key may not have the necessary permissions for the Gemini API, or the API may not be enabled in your Google Cloud project.";
            } else if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
                 errorMessage = "Image generation was blocked, likely due to safety filters. Please revise your prompt and/or reference image.";
            } else if (error.message.includes("Invalid content") || error.message.includes("image format")) {
                 errorMessage = "The reference image might be invalid or in an unsupported format. Please try a different image.";
            } else if (error.message.length < 250) {
                 errorMessage = error.message;
            }
        }
        throw new Error(errorMessage);
    }
  }
);
