
"use client";

import type React from "react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { selectAiModel, type SelectAiModelInput } from "@/ai/flows/select-ai-model-flow";
import { PromptForm, type PromptFormValuesSchema, promptFormSchema } from "./PromptForm";
import { ImageGallery } from "./ImageGallery";
import { parseCsv } from "@/lib/csvParser";
import ImageForgeLogo from "./icons/ImageForgeLogo";
import { Loader2 } from "lucide-react";

interface GeneratedImage {
  imageUrl: string;
  altText: string;
  promptUsed: string;
}

const defaultValues: PromptFormValuesSchema = {
  startPrompt: `**Consistency Requirements** (Fixed Across All Images):
- **Art Style**: Clean, semi-futuristic illustration with crisp lines, vibrant colors, and a professional tone.
- **Consistent Element (Bob)**: Include Bob, a sleek humanoid robot with a red-armored body, glowing blue LED eyes, and a single robotic arm with precise movements, identical in every image. Bob is prominently centered unless otherwise specified.
- **Color Palette**: Use only #0055FF (Blue), #FF0000 (Red), #FFFFFF (White), #1C2526 (Dark Gray).
- **Resolution**: 1920x1080, 16:9.
- **Negative Prompt**: Avoid blurry, cartoonish, overly complex, cluttered, low contrast.

**Scene Details** (Based on the following data from each CSV row):`,
  csvText: `Concept,Scene,Bob's Action,Props/Elements,Mood/Tone
Readiness Checkpoint,Governance & Community Scoreboard,Bob ticking a checklist with his robotic arm,Scorecard with Product Community Security Economics Operations,Bob looks thoughtful visualizes readiness quiz
Decentralized Governance,DAO Hub with floating charts,Bob presenting holographic DAO,Community avatars data streams,Optimistic collaborative
Blockchain Security,Fortified Data Core Facility,Bob shielding data core with arm,Network nodes glowing firewalls,Secure vigilant`,
  endPrompt: "The image must be highly consistent with the **Consistency Requirements** in Bob’s design, art style, logo placement (if specified in scene details), and color palette, while accurately reflecting the unique scene details.",
};

export default function ImageForgeApp() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const { toast } = useToast();

  const form = useForm<PromptFormValuesSchema>({
    resolver: zodResolver(promptFormSchema),
    defaultValues,
  });

  const formatRowData = (row: Record<string, string>): string => {
    return Object.entries(row)
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
        return `- **${formattedKey}**: ${value}`;
      })
      .join('\n'); // Join with newline for itemized list
  };

  const onSubmit: SubmitHandler<PromptFormValuesSchema> = async (data) => {
    setIsLoading(true);
    setGeneratedImages([]);
    setProgressMessage("Starting image generation...");

    const parseResult = parseCsv(data.csvText);
    if ("error" in parseResult) {
      toast({
        variant: "destructive",
        title: "CSV Parsing Error",
        description: parseResult.error,
      });
      setIsLoading(false);
      return;
    }

    const rows = parseResult;
    if (rows.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "CSV data resulted in no rows to process.",
      });
      setIsLoading(false);
      return;
    }

    const newImages: GeneratedImage[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setProgressMessage(`Generating image ${i + 1} of ${rows.length}...`);
      const formattedRowData = formatRowData(row);
      
      let fullPrompt = `${data.startPrompt}\n${formattedRowData}\n${data.endPrompt}`;
      fullPrompt = fullPrompt.trim();

      try {
        const aiInput: SelectAiModelInput = {
          prompt: fullPrompt,
        };
        
        const result = await selectAiModel(aiInput);
        newImages.push({ imageUrl: result.imageUrl, altText: result.altText, promptUsed: fullPrompt });
        setGeneratedImages(prevImages => [...prevImages.slice(0, i), { imageUrl: result.imageUrl, altText: result.altText, promptUsed: fullPrompt }, ...prevImages.slice(i + 1)]);
      } catch (error) {
        console.error("Error generating image for row:", row, error);
        toast({
          variant: "destructive",
          title: `Error generating image for row ${i + 1}`,
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    }

    setProgressMessage(newImages.length > 0 ? "Image generation complete!" : "No images were generated.");
    if (newImages.length > 0) {
       toast({
        title: "Success!",
        description: `Successfully generated ${newImages.length} images.`,
        variant: "default",
        className: "bg-accent text-accent-foreground"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-background">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-3">
          <ImageForgeLogo className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold text-primary">ImageForge</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Generate multiple images from CSV data using AI, with consistent elements.
        </p>
      </header>

      <main className="flex-grow container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-4 shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <PromptForm form={form} onSubmit={form.handleSubmit(onSubmit)} isLoading={isLoading} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-8 shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Generated Images</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{progressMessage}</p>
                </div>
              )}
              {!isLoading && generatedImages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-off h-16 w-16 text-muted-foreground mb-4"><path d="M21.16 21.16 2.84 2.84"/><path d="M11.35 3H19a2 2 0 0 1 2 2v8.65m-7.83 7.83A2 2 0 0 1 5 21H5a2 2 0 0 1-2-2v-2.55"/><path d="M14.54 12.46 5 22"/><path d="m17 7-2.5-2.5"/><path d="M5 12V5a2 2 0 0 1 2-2h4.55"/></svg>
                  <p className="text-muted-foreground">
                    Your generated images will appear here.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure your prompts and data, then click "Generate Images".
                  </p>
                </div>
              )}
              {!isLoading && generatedImages.length > 0 && (
                <ImageGallery images={generatedImages} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="text-center mt-12 py-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ImageForge. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

