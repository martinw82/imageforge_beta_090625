
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

export const promptFormSchema = z.object({
  startPrompt: z.string().min(1, "Start prompt (including consistency rules) is required."),
  csvText: z.string().min(1, "CSV data is required."),
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
                  placeholder="Concept,Scene,Bob's Action,Props/Elements,Mood/Tone&#10;Readiness Checkpoint,Governance & Community Scoreboard,Bob ticking a checklist...,Scorecard with labels,Bob looks thoughtful...&#10;Decentralized Governance,DAO Hub with charts,Bob presenting DAO,Community avatars,Optimistic..."
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
                  placeholder="e.g., The image must be highly consistent with previous outputs in Bob’s design, art style..."
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
                  {...rest}
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
                  autoComplete="new-password" // To prevent autofill from other password fields
                />
              </FormControl>
              <FormDescription>
                If provided, this key will be used. Otherwise, server's pre-configured key (if any) is used. For production, set keys as server environment variables.
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
