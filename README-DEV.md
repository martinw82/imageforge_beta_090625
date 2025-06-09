
# ImageForge - Developer Guide

This document provides information for developers looking to understand, contribute to, or fork the ImageForge application.

## Overview

ImageForge is a Next.js web application that allows users to batch-generate series of images using AI, driven by structured data from CSV or TSV files. It leverages Genkit to interact with Google AI models for image generation, focusing on visual consistency across batches.

## Project Structure

-   `src/app/`: Main Next.js app router, pages, and layout.
    -   `page.tsx`: Entry point rendering the main `ImageForgeApp` component.
    -   `layout.tsx`: Root layout, including global styles and font setup.
    -   `globals.css`: Global styles and Tailwind CSS theme variables (ShadCN).
-   `src/components/`: React components used to build the UI.
    -   `ImageForgeApp.tsx`: The core application component orchestrating the UI and logic.
    -   `PromptForm.tsx`: Handles the input form for prompts, data, and settings.
    -   `ImageGallery.tsx`: Displays the generated images.
    -   `ui/`: ShadCN UI components (Button, Card, Input, Select, etc.).
    -   `icons/`: Custom SVG icons.
-   `src/ai/`: Genkit AI-related code.
    -   `genkit.ts`: Initializes the global Genkit `ai` object with plugins and default model.
    -   `flows/select-ai-model-flow.ts`: The main Genkit flow responsible for taking user input and generating an image using the Gemini model. It handles API key selection and reference image processing.
    -   `dev.ts`: Development server entry point for Genkit flows.
-   `src/lib/`: Utility functions.
    -   `utils.ts`: General utility functions (e.g., `cn` for Tailwind class merging).
    -   `csvParser.ts`: Parses CSV and TSV text/files into structured data.
-   `src/hooks/`: Custom React hooks.
    -   `use-toast.ts`: Handles toast notifications.
-   `public/`: Static assets (not heavily used in this project beyond potential future favicons).
-   `pages/api/`: (Not currently used for primary functionality as Genkit flows are server actions)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd imageforge
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    *   Create a `.env.local` file in the root of the project.
    *   You may need to add your `GOOGLE_API_KEY` if you intend to use a default server-side key for Genkit:
        ```
        GOOGLE_API_KEY=your_google_ai_api_key
        ```
        (Note: The app allows users to input their own key, which can override this).
4.  **Run the development server for Next.js:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will typically start the Next.js app on `http://localhost:9002`.

5.  **Run the Genkit development server (optional, for flow development/testing):**
    Open a new terminal and run:
    ```bash
    npm run genkit:dev
    # or (for watching changes)
    npm run genkit:watch
    ```
    This starts the Genkit developer UI, usually on `http://localhost:4000`, where you can inspect and test flows.

## Key Technologies

*   **Next.js:** React framework (App Router).
*   **React:** UI library.
*   **TypeScript:** For static typing.
*   **ShadCN UI:** Pre-built, accessible UI components.
*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **Genkit (by Google):** Open-source framework for building AI-powered applications. Used for defining and running the image generation flow.
*   **Zod:** Schema validation, used extensively in forms and Genkit flows.
*   **React Hook Form:** For managing form state and validation.

## AI Flow: `select-ai-model-flow.ts`

This is the heart of the AI image generation:

*   **Input (`SelectAiModelInputSchema`):**
    *   `prompt`: The full text prompt for the image.
    *   `apiKey` (optional): User-provided Google AI API key.
    *   `referenceImageDataUri` (optional): Base64 encoded data URI of a reference image.
*   **Output (`SelectAiModelOutputSchema`):**
    *   `imageUrl`: Data URI of the generated image.
    *   `altText`: The prompt used, for alt text.
*   **Logic:**
    1.  Determines whether to use a user-provided API key or a server-configured one to initialize a Genkit client.
    2.  Constructs the prompt for the `gemini-2.0-flash-exp` model, including the reference image if provided.
    3.  Calls `ai.generate()` to get the image.
    4.  Handles errors and returns the image URL.

## Potential Upgrades & Roadmap (To-Do)

This list provides ideas for future enhancements and contributions.

### UI/UX Enhancements

*   **[ ] Drag & Drop File Uploads:** For CSV/TSV and reference images.
*   **[ ] Real-time Preview (Debounced):** As settings change, show a low-fidelity preview of what the first image *might* look like (could be challenging with API costs/latency).
*   **[ ] Bulk Download:** Option to download all generated images as a ZIP file.
*   **[ ] Granular Error Feedback:** Display errors specific to each image generation attempt within the gallery if a batch partially fails.
*   **[ ] Theme Toggle:** Simple light/dark mode toggle if the ShadCN theme supports it easily.
*   **[ ] Save/Load Prompt Configurations:** Allow users to save their entire setup (start prompt, CSV data template, end prompt, API key, delay) to local storage or download/upload as a JSON file.
*   **[ ] Pagination/Virtualization for Gallery:** For very large batches of images to improve performance.
*   **[ ] Clearer Indication of Data Source:** Visually distinguish if data is coming from the text area or an uploaded file more prominently.
*   **[ ] More Input Validation & Feedback:** For prompt lengths, API key format (client-side).

### AI Flow & Feature Enhancements

*   **[ ] Model Selection:** If Genkit easily supports it, allow users to select from different compatible image generation models or model versions.
*   **[ ] Expose More Model Parameters:** If `gemini-2.0-flash-exp` or other models support parameters like `quality`, `num_inference_steps`, `negative_prompt` (distinct from text prepended), expose these via Genkit config.
*   **[ ] Advanced Prompting Techniques:** Investigate and integrate techniques like prompt weighting if the model and Genkit support it for finer control.
*   **[ ] Tool Use in Genkit Flows:**
    *   For more complex scenarios, e.g., a flow that fetches data from an external API (like current weather or stock prices) to incorporate into the image prompt based on CSV input.
*   **[ ] "Prompt Library" Feature:** Allow users to save, name, and load their own custom `startPrompt`, `csvText` (as a template structure), and `endPrompt` combinations.
*   **[ ] Generation History:** Store a history of generated batches (metadata, not necessarily all images) using local storage for easy review.
*   **[ ] Direct Text Overlay (Client-Side):** After images are generated, provide a simple client-side tool to overlay text onto the images. This addresses the AI's weakness in rendering precise text.
*   **[ ] Alternative Batch Tasks (New "Forge" Apps or Modes):**
    *   **TextForge:** Batch text generation (product descriptions, social media posts) using LLMs. UI would need to adapt to text inputs/outputs.
    *   **DataForge:** Batch data analysis (sentiment analysis, keyword extraction).

### Performance & Optimization

*   **[ ] Image Compression:** Offer client-side options to compress generated images before download (e.g., using `canvas` or a library like `browser-image-compression`).
*   **[ ] Optimize CSV/TSV Parsing:** For potentially very large files, although there's a 1MB UI limit currently.
*   **[ ] Server-Side Processing for Large Batches:** For extremely large batches, consider a backend queue system (though this significantly increases complexity beyond the current client-driven approach).

### Code Quality & Maintenance

*   **[ ] Comprehensive Testing:** Add more unit tests (especially for `csvParser`, form validation logic) and integration tests for the AI flow.
*   **[ ] Refactor Large Components:** If `ImageForgeApp.tsx` or `PromptForm.tsx` become too unwieldy, break them down further.
*   **[ ] Genkit Flow Modularity:** If more AI flows are added, organize them clearly.
*   **[ ] Documentation:** Keep JSDoc/TSDoc comments updated.

## Contributing

Contributions are welcome! If you'd like to contribute:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3.  **Make your changes.**
4.  **Test your changes thoroughly.**
5.  **Commit your changes** (`git commit -m 'Add some feature'`).
6.  **Push to the branch** (`git push origin feature/your-feature-name`).
7.  **Open a Pull Request.**

Please ensure your code follows the existing style and that any new features are well-documented. For major changes, it's a good idea to open an issue first to discuss the proposed changes.

---

Happy developing!
