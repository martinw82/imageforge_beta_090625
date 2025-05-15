
"use client";

import type { UseFormReturn, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

export const promptFormSchema = z.object({
  startPrompt: z.string().min(1, "Start prompt is required."),
  csvText: z.string().min(1, "CSV data is required."),
  endPrompt: z.string().min(1, "End prompt is required."),
  // modelName: z.string().min(1, "Model name is required."), // Removed
  imageSize: z.string().optional(),
  imageStyle: z.string().optional(),
});

export type PromptFormValuesSchema = z.infer<typeof promptFormSchema>;

interface PromptFormProps {
  form: UseFormReturn<PromptFormValuesSchema>;
  onSubmit: SubmitHandler<PromptFormValuesSchema>;
  isLoading: boolean;
}

export function PromptForm({ form, onSubmit, isLoading }: PromptFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="startPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., A photo of a product:"
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Text that will precede each row's data in the prompt.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="csvText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CSV Data</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="header1,header2,header3&#10;value1a,value2a,value3a&#10;value1b,value2b,value3b"
                  className="resize-y min-h-[150px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>Paste your CSV data here. The first row should be headers.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., in a bright, clean environment."
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Text that will follow each row's data in the prompt.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ModelName FormField removed */}
           <FormField
            control={form.control}
            name="imageSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image Size (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1024x1024" {...field} />
                </FormControl>
                 <FormDescription>Guidance for desired image dimensions (included in prompt).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="imageStyle"
            render={({ field }) => (
              <FormItem className="sm:col-start-2">
                <FormLabel>Image Style (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., photorealistic, artistic" {...field} />
                </FormControl>
                <FormDescription>Preferred visual style for images (included in prompt).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Images"
          )}
        </Button>
      </form>
    </Form>
  );
}

