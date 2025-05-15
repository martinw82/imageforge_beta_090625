
'use server';

/**
 * @fileOverview Allows users to select an AI model and adjust parameters for image generation.
 *
 * - selectAiModel - A function to select an AI model and its parameters.
 * - SelectAiModelInput - The input type for the selectAiModel function.
 * - SelectAiModelOutput - The return type for the selectAiModel function.
 */

import { genkit } from 'genkit'; // Genkit core for dynamic client instantiation
import { googleAI } from '@genkit-ai/googleai'; // Google AI plugin
import { ai as globalAi } from '@/ai/genkit'; // Pre-configured global Genkit client
import { z } from 'genkit'; // Genkit's Zod for schema definition
import { ZodError } from 'zod'; // ZodError for specific error handling

const SelectAiModelInputSchema = z.object({
  prompt: z.string().describe('The comprehensive text prompt for image generation, including all consistency rules and scene details.'),
  apiKey: z.string().optional().describe('Optional Google AI API Key. If not provided, uses server configuration.'),
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

// This prompt definition is primarily for schema validation and documentation
// if the flow were to be invoked through other Genkit mechanisms.
// The actual generation logic within the flow dynamically selects or configures the client.
const selectAiModelPromptDefinition = globalAi.definePrompt({
  name: 'selectAiModelPrompt',
  input: { schema: SelectAiModelInputSchema },
  output: { schema: SelectAiModelOutputSchema },
  prompt: `Generate an image based on the following detailed prompt: {{{prompt}}}\n\nThis prompt may include specific instructions for model, size, and style. Ensure the image is appropriate and adheres to all instructions in the main prompt. If an apiKey is provided in the input, it should be considered for configuring the generation call.`,
});

const selectAiModelFlow = globalAi.defineFlow(
  {
    name: 'selectAiModelFlow',
    inputSchema: SelectAiModelInputSchema,
    outputSchema: SelectAiModelOutputSchema,
  },
  async (input) => {
    let clientToUse = globalAi; // Default to the globally configured Genkit client

    if (input.apiKey && input.apiKey.trim() !== "") {
      console.log("Attempting to use provided API key for image generation.");
      // WARNING: Passing API keys from the client is generally not recommended for production
      // environments due to security risks. API keys should ideally be configured
      // via environment variables on the server. This feature is for ease of prototyping.
      try {
        const dynamicClient = genkit({
          plugins: [googleAI({ apiKey: input.apiKey })],
          // No specific model needed here for the client, it's specified in generate()
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
      const { media } = await clientToUse.generate({
        model: 'googleai/gemini-2.0-flash-exp', // This specific model is required for image generation by Google AI
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // Required for image generation
        },
      });

      if (!media?.url) {
        // This case might occur if the prompt is blocked by safety filters or other issues.
        throw new Error("The AI service did not return an image. This could be due to safety filters, an issue with the prompt, or an internal service error.");
      }

      return {
        imageUrl: media.url,
        altText: input.prompt, // Alt text is the full prompt used
      };
    } catch (error: any) {
        console.error("Error during image generation with selected client:", error);
        // Provide more specific error messages to the user
        let errorMessage = "An unexpected error occurred during image generation.";
        if (error.message) {
            if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
                errorMessage = "The provided API key is not valid or is missing. Please check it and try again. For server-configured keys, ensure it's set correctly in the environment.";
            } else if (error.message.includes("quotaExceeded") || error.message.includes("billing account")) {
                errorMessage = "API quota exceeded or a billing issue occurred. Please check your Google AI account status and billing settings.";
            } else if (error.message.includes("permission denied") || error.message.includes("IAM")) {
                 errorMessage = "Permission denied. The API key may not have the necessary permissions for the Gemini API, or the API may not be enabled in your Google Cloud project.";
            } else if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
                 errorMessage = "Image generation was blocked, likely due to safety filters. Please revise your prompt.";
            } else if (error.message.length < 250) { // Keep error messages concise
                 errorMessage = error.message;
            }
        }
        throw new Error(errorMessage);
    }
  }
);
