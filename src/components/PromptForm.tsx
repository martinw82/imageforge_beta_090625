
"use client";

import type { UseFormReturn, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Input component is no longer needed here as imageSize and imageStyle are removed.
// import { Input } from "@/components/ui/input"; 
// import { Label } from "@/components/ui/label"; // No longer needed if Input fields are removed
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

// Schema updated: imageSize and imageStyle are removed.
// These are now part of the startPrompt.
export const promptFormSchema = z.object({
  startPrompt: z.string().min(1, "Start prompt (including consistency rules) is required."),
  csvText: z.string().min(1, "CSV data is required."),
  endPrompt: z.string().min(1, "End prompt is required."),
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
              <FormLabel>Start Prompt (Consistency Rules)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Define fixed consistency rules (Art Style, Bob's Design, Colors, Resolution, Negative Prompts) that precede each row's data."
                  className="resize-y min-h-[150px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>This text, including all consistency rules, will precede each row's data in the full prompt.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="csvText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CSV Data (Scene Details)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="header1,header2,header3&#10;value1a,value2a,value3a&#10;value1b,value2b,value3b"
                  className="resize-y min-h-[150px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>Paste your CSV data here. Each row defines a unique scene. The first row should be headers.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Prompt (Reinforce Consistency)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Ensure high consistency with defined rules."
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>This text will follow each row's data in the full prompt, typically to reinforce consistency.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* ImageSize and ImageStyle FormFields are removed as these are now part of startPrompt */}

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
