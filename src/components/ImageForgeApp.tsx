
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { selectAiModel, type SelectAiModelInput } from "@/ai/flows/select-ai-model-flow";
import { PromptForm, type PromptFormValuesSchema, promptFormSchema } from "./PromptForm";
import { ImageGallery } from "./ImageGallery";
import { parseDelimitedText } from "@/lib/csvParser";
import ImageForgeLogo from "./icons/ImageForgeLogo";
import { Loader2, Image as ImageIcon, FileText } from "lucide-react";
import NextImage from "next/image";

interface GeneratedImage {
  imageUrl: string;
  altText: string;
  promptUsed: string;
  fileNameHint: string;
}

const defaultValues: PromptFormValuesSchema = {
  startPrompt: `**Consistency Requirements** (Fixed Across All Images - Your Channel Brand):
- **Art Style**: Bright, engaging, and professional, designed to maximize click-through rates. Use vibrant, saturated colors.
- **Consistent Element (Optional Channel Logo/Mascot)**: If you use a reference image (e.g., your channel logo or mascot), your 'Thumbnail Details' below should describe how it should be consistently placed (e.g., "Place the channel logo from the reference image subtly in the bottom-left corner of every thumbnail."). If no reference image, this rule is ignored.
- **Overall Feel**: Energetic and attention-grabbing.
- **Color Palette Guidance**: Suggest primary and secondary colors from your channel's branding to guide the AI, e.g., "Main colors: #FFD700 (Gold), #4A90E2 (Bright Blue)." The AI will use these as strong suggestions.
- **Resolution**: 1280x720 (standard YouTube thumbnail).
- **Negative Prompt**: Avoid blurry, low-contrast, cluttered, uninteresting, amateurish designs. Do not generate actual legible text, but leave clear space or a stylized background for text to be added later.
- **Using a Reference Image**: If you provide a reference image for a logo/mascot, ensure your 'Thumbnail Details' (from the CSV/TSV) specify its placement or integration. For other types of reference images (e.g., a product shot), describe how the AI should incorporate or draw inspiration from it.

**Thumbnail Details** (Based on the following data from each CSV/TSV row - this is where your CSV data for each video will go):`,
  csvText: `Video_Title_Concept,Main_Visual_Element,Dominant_Color_Suggestion,Text_Placeholder_Idea
"My Epic Travel Adventure","Backpacker silhouette against a stunning mountain vista","Deep blues and oranges","EPISODE 1: MOUNTAIN PEAK"
"Ultimate Gaming Setup 2024","Close-up of a glowing RGB keyboard and high-tech mouse","Cyberpunk purples and teals","MY NEW SETUP!"
"Cooking the Perfect Pizza","Delicious-looking pizza with melting cheese, action shot of slicing","Warm reds and yellows","WORLD'S BEST PIZZA?"`,
  csvFile: null,
  endPrompt: "The image must be highly consistent with the **Consistency Requirements** in terms of art style and overall feel, suitable for a YouTube thumbnail, while accurately reflecting the unique **Thumbnail Details** for each video. Remember to leave clear visual space for text overlays.",
  apiKey: "",
  referenceImage: null,
  delaySeconds: 0,
};

export default function ImageForgeApp() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [uploadedDataFileName, setUploadedDataFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PromptFormValuesSchema>({
    resolver: zodResolver(promptFormSchema),
    defaultValues,
  });

  const watchedReferenceImage = form.watch("referenceImage");
  const watchedCsvFile = form.watch("csvFile");

  useEffect(() => {
    if (watchedReferenceImage instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(watchedReferenceImage);
    } else if (watchedReferenceImage === null) {
      setReferenceImagePreview(null);
    }
  }, [watchedReferenceImage]);

  useEffect(() => {
    if (watchedCsvFile instanceof File) {
      setUploadedDataFileName(watchedCsvFile.name);
    } else if (watchedCsvFile === null) {
      setUploadedDataFileName(null);
    }
  }, [watchedCsvFile]);


  const formatRowData = (row: Record<string, string>): string => {
    return Object.entries(row)
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        return `- **${formattedKey}**: ${value}`;
      })
      .join('\n');
  };

  const onSubmit: SubmitHandler<PromptFormValuesSchema> = async (data) => {
    setIsLoading(true);
    setGeneratedImages([]);
    setProgressMessage("Starting image generation...");

    let referenceImageDataUri: string | undefined = undefined;
    if (data.referenceImage instanceof File) {
      try {
        referenceImageDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(data.referenceImage);
        });
      } catch (error) {
        console.error("Error reading reference image:", error);
        toast({
          variant: "destructive",
          title: "Error Reading Image",
          description: "Could not process the reference image. Please try again or select a different image.",
        });
        setIsLoading(false);
        return;
      }
    }

    let dataTextToParse: string;
    let fileTypeHint: "CSV" | "TSV" = "CSV"; 

    if (data.csvFile instanceof File) {
      const uploadedFile = data.csvFile;
      const fileName = uploadedFile.name.toLowerCase();
      if (fileName.endsWith(".tsv") || uploadedFile.type === "text/tab-separated-values") {
        fileTypeHint = "TSV";
      }
      setProgressMessage(`Reading ${fileTypeHint} file...`);
      try {
        dataTextToParse = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsText(uploadedFile);
        });
      } catch (error) {
        console.error(`Error reading ${fileTypeHint} file:`, error);
        toast({
          variant: "destructive",
          title: `Error Reading ${fileTypeHint} File`,
          description: `Could not process the uploaded ${fileTypeHint} file. Please check the file and try again.`,
        });
        setIsLoading(false);
        return;
      }
    } else if (data.csvText && data.csvText.trim() !== "") {
      dataTextToParse = data.csvText;
      if (dataTextToParse.includes('\t') && !dataTextToParse.includes(',')) {
          fileTypeHint = "TSV";
      }
    } else {
      toast({
        variant: "destructive",
        title: "No Data Provided",
        description: "Please either paste CSV/TSV data into the text area or upload a CSV/TSV file.",
      });
      setIsLoading(false);
      return;
    }
    setProgressMessage(`Parsing ${fileTypeHint} data...`);
    const delimiter = fileTypeHint === "TSV" ? "\t" : ",";
    const parseResult = parseDelimitedText(dataTextToParse, delimiter);

    if ("error" in parseResult) {
      toast({
        variant: "destructive",
        title: `${fileTypeHint} Parsing Error`,
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
        description: `${fileTypeHint} data resulted in no rows to process.`,
      });
      setIsLoading(false);
      return;
    }

    const newImages: GeneratedImage[] = [];
    const delayBetweenGenerations = data.delaySeconds || 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setProgressMessage(`Generating image ${i + 1} of ${rows.length}...`);
      const formattedRowData = formatRowData(row);

      let fullPrompt = `${data.startPrompt}\n${formattedRowData}\n${data.endPrompt}`;
      fullPrompt = fullPrompt.trim();

      const firstColumnKey = Object.keys(row)[0];
      // Try to use "Video_Title_Concept" or "Concept" for filename, then fallback to first column or generic.
      let fileNameBase = row["Video_Title_Concept"] || row["Concept"] || (firstColumnKey ? row[firstColumnKey] : '') || `image_${i + 1}`;
      if (typeof fileNameBase !== 'string' || fileNameBase.trim() === '') {
          fileNameBase = `image_${i + 1}`;
      }

      try {
        const aiInput: SelectAiModelInput = {
          prompt: fullPrompt,
          apiKey: data.apiKey,
          referenceImageDataUri: referenceImageDataUri,
        };

        const result = await selectAiModel(aiInput);
        const newImage = {
          imageUrl: result.imageUrl,
          altText: result.altText,
          promptUsed: fullPrompt,
          fileNameHint: fileNameBase
        };
        newImages.push(newImage);
        setGeneratedImages(prevImages => [...prevImages, newImage]);

      } catch (error) {
        console.error("Error generating image for row:", row, error);
        toast({
          variant: "destructive",
          title: `Error generating image for row ${i + 1}`,
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }

      if (delayBetweenGenerations > 0 && i < rows.length - 1) {
        setProgressMessage(`Waiting for ${delayBetweenGenerations} seconds before generating image ${i + 2}...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenGenerations * 1000));
      }
    }

    setProgressMessage(newImages.length > 0 ? "Image generation complete!" : "No images were generated, or all failed.");
    if (newImages.length > 0) {
       toast({
        title: "Success!",
        description: `Successfully generated ${newImages.length} images.`,
        variant: "default",
        className: "bg-accent text-accent-foreground rounded-md shadow-lg"
      });
    } else if (rows.length > 0) {
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: "No images were generated. Check console for errors.",
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
          Generate multiple images from CSV or TSV data using AI, with consistent elements and optional reference images.
          <br />
          Now pre-configured with defaults for YouTube Thumbnails! Adjust prompts for other uses like comic panels or product shots.
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
              <div className="mt-4 space-y-3">
                {referenceImagePreview && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <h3 className="text-xs font-medium text-foreground mb-1.5">Reference Image Preview:</h3>
                    <NextImage
                      src={referenceImagePreview}
                      alt="Reference image preview"
                      width={80}
                      height={80}
                      className="rounded-md object-contain max-h-24 w-auto"
                      data-ai-hint="user uploaded"
                    />
                  </div>
                )}
                {uploadedDataFileName && (
                   <div className="p-3 border rounded-lg bg-muted/50">
                    <h3 className="text-xs font-medium text-foreground mb-1.5 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      Uploaded Data File:
                    </h3>
                    <p className="text-sm text-foreground truncate">{uploadedDataFileName}</p>
                  </div>
                )}
              </div>
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
                   <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Your generated images will appear here.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure your prompts, data, and optionally a reference image, then click "Generate Images".
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
