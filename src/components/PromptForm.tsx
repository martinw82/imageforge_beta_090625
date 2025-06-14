
"use client";

import type { UseFormReturn, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { PromptTemplate } from "./ImageForgeApp"; // Import the PromptTemplate type

export const promptFormSchema = z.object({
  startPrompt: z.string().min(1, "Start prompt (including consistency rules) is required."),
  csvText: z.string().optional(),
  csvFile: z
    .instanceof(typeof File !== 'undefined' ? File : Object)
    .optional()
    .nullable()
    .refine(
      (file) => {
        if (!file) return true;
        const fileName = typeof file.name === 'string' ? file.name.toLowerCase() : '';
        return (
          file.type === "text/csv" ||
          file.type === "text/tab-separated-values" ||
          fileName.endsWith('.csv') ||
          fileName.endsWith('.tsv')
        );
      },
      `Uploaded file must be a CSV (.csv) or TSV (.tsv) file.`
    )
    .refine(
      (file) => !file || file.size <= 1 * 1024 * 1024, // 1MB limit
      `Uploaded file must be less than 1MB.`
    ),
  endPrompt: z.string().min(1, "End prompt is required."),
  apiKey: z.string().optional(),
  referenceImage: z
    .instanceof(typeof File !== 'undefined' ? File : Object)
    .optional()
    .nullable()
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024, // 5MB limit
      `Reference image must be less than 5MB.`
    )
    .refine(
      (file) => !file || (file.type && file.type.startsWith("image/")),
      `Reference file must be an image.`
    ),
  delaySeconds: z.number().min(0).optional().default(0),
  // selectedTemplateId is not needed in the schema, selection directly updates other fields
}).superRefine((data, ctx) => {
  if (!data.csvFile && (!data.csvText || data.csvText.trim() === "")) {
    const errorMessage = "Either paste data into the text area or upload a CSV/TSV file.";
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: errorMessage,
      path: ["csvText"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: errorMessage,
      path: ["csvFile"],
    });
  }
});

export type PromptFormValuesSchema = z.infer<typeof promptFormSchema>;

interface PromptFormProps {
  form: UseFormReturn<PromptFormValuesSchema>;
  onSubmit: SubmitHandler<PromptFormValuesSchema>;
  isLoading: boolean;
  promptTemplates: PromptTemplate[]; // Add promptTemplates prop
}

export function PromptForm({ form, onSubmit, isLoading, promptTemplates }: PromptFormProps) {
  
  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = promptTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      form.setValue("startPrompt", selectedTemplate.startPrompt, { shouldValidate: true });
      form.setValue("csvText", selectedTemplate.csvText, { shouldValidate: true });
      form.setValue("endPrompt", selectedTemplate.endPrompt, { shouldValidate: true });
      // Optionally clear csvFile if a template populates csvText, or manage as preferred.
      // For now, let's not clear csvFile, user can manually remove it if they prefer template text.
      // form.setValue("csvFile", null); 
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormItem>
          <FormLabel>Prompt Template (Optional)</FormLabel>
          <Select onValueChange={handleTemplateChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a prompt template" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {promptTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Choose a template to pre-fill prompts and example data for common use cases.
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="startPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Prompt (Consistency Rules)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Define fixed consistency rules (Art Style, Character/Logo, Colors, Resolution, Negative Prompts) that precede each row's data."
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
              <FormLabel>Data Input (CSV or TSV format) - Text Area</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Column_Header_1,Column_Header_2&#10;Row1_Value1,Row1_Value2&#10;Row2_Value1,Row2_Value2&#10;&#10;Or paste TSV data (tab-separated) here."
                  className="resize-y min-h-[150px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Paste your CSV or TSV data here, or upload a file below. If a file is uploaded, its content will be used. Each row defines a unique scene. The first row should be headers.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="csvFile"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Upload Data File (CSV or TSV)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".csv,text/csv,.tsv,text/tab-separated-values"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    onChange(file || null);
                  }}
                  name={rest.name}
                  onBlur={rest.onBlur}
                  ref={rest.ref}
                  disabled={rest.disabled}
                  className="file:text-primary file:font-medium"
                />
              </FormControl>
              <FormDescription>
                Upload a .csv or .tsv file. If provided, this will be used instead of the text area. Max 1MB.
              </FormDescription>
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
                  placeholder="e.g., The image must be highly consistent with previous outputs in style and character design..."
                  className="resize-y min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>This text will follow each row's data in the full prompt, typically to reinforce consistency.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referenceImage"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Reference Image (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    onChange(file || null);
                  }}
                  name={rest.name}
                  onBlur={rest.onBlur}
                  ref={rest.ref}
                  disabled={rest.disabled}
                  className="file:text-primary file:font-medium"
                />
              </FormControl>
              <FormDescription>
                Upload an image (e.g., character, logo) to be used as a reference by the AI. Max 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="delaySeconds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delay Between Generations</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value, 10))}
                defaultValue={String(field.value || 0)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a delay" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">No delay</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="20">20 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Wait for a specified duration after each image generation (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google AI API Key (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your Google AI API Key"
                  {...field}
                  autoComplete="new-password"
                />
              </FormControl>
              <FormDescription>
                If provided, this key will be used. Otherwise, server's pre-configured key (if any) is used.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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

    