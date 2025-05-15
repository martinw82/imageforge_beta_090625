"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface GeneratedImage {
  imageUrl: string;
  altText: string; // This usually contains the full prompt from the AI flow
  promptUsed: string; // The full prompt constructed by the app
}

interface ImageGalleryProps {
  images: GeneratedImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  if (images.length === 0) {
    return null; 
  }

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Sanitize prompt for filename
      const fileNameSafePrompt = prompt.substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `imageforge_${fileNameSafePrompt || 'generated_image'}.${blob.type.split('/')[1] || 'png'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Optionally, show a toast notification for download error
    }
  };


  return (
    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {images.map((image, index) => (
          <Card key={index} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <div className="aspect-square relative w-full">
                <Image
                  src={image.imageUrl}
                  alt={image.altText}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="generated image"
                  className="bg-muted"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <CardDescription className="text-xs truncate cursor-help">
                      Prompt: {image.promptUsed}
                    </CardDescription>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs break-words">
                    <p className="text-sm">{image.promptUsed}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full"
                onClick={() => handleDownload(image.imageUrl, image.promptUsed)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}
