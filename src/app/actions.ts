'use server'

import { put } from '@vercel/blob';
import { GeneratedImage } from '@/types';

export async function generateImages(prompts: string[]): Promise<GeneratedImage[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('prompts', prompts);

  
  // Return fake image URLs (using placeholder images) with titles
  return prompts.map((prompt) => ({
    url: `https://picsum.photos/seed/${Math.random()}/400/400`,
    title: prompt
  }));
}

