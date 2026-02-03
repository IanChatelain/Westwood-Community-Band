'use client';

import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
  }

  public async generateContentSuggestion(topic: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Write a short, engaging description for a community band website about: ${topic}. Keep it professional yet warm.`
      });
      return response.text || "Could not generate content at this time.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "An error occurred while generating content.";
    }
  }
}

export const gemini = new GeminiService();
