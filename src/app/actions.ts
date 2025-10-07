'use server';

import { put } from '@vercel/blob';
import { GeneratedImage } from '@/types';
import { googleAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

// Initialize the AI client using Google Genkit
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

// Set model here, e.g. change to 'imagen-4.0-generate-001' for cheaper images
const IMAGE_GEN_MODEL = 'gemini-2.5-flash-image';

/**
 * Generates a visual concept from a blog post title.
 */
async function generateVisualConcept(blogPostTitle: string): Promise<string> {
  const systemPrompt = `You are a creative director for Endo-App, a certified German health app that supports people with endometriosis and adenomyosis.
Given a German blog post title, write one short visual concept (1–2 sentences) describing a realistic photo-based scene that fits the topic and feels emotionally supportive for people affected by endometriosis. Can show some pain or discomfort but should not be too dark or clinical.

Examples:
1. Title: "Endometriose, Reizdarm und Essstörungen – Stimme aus der Praxis"
   Concept: "A woman sitting at a table, looking down at a plate of food with visible discomfort or disinterest. The cozy, softly lit living room setting contrasts with her tense expression, emphasizing a sense of emotional or physical unease."
2. Title: "Natürlich schwanger werden mit Endometriose und Adenomyose – Was du selbst tun kannst"
   Concept: "A woman sitting on a chair, holding a positive pregnancy test with a smile. The composition feels calm and natural, suggesting mindfulness, connection, or new beginnings."
3. Title: "Endometriose und Arztbesuche: Dein Leitfaden für erfolgreiche Gespräche"
   Concept: "A doctor sitting at a desk, smiling warmly while writing on a document. The bright, clean setting and her approachable expression convey professionalism, trust, and attentive care."

Output only the single concept sentence in english — nothing else.`;

  const response = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    system: systemPrompt,
    prompt: blogPostTitle,
  });

  return response.text;
}

/**
 * Generates an image based on a visual concept.
 */
async function generateImage(visualConcept: string): Promise<string> {
  const getImagePrompt = (visualConcept: string) => {
    return `Generate a photo-realistic image for the blog header of a certified medical app for endometriosis and adenomyosis.
- Scene: ${visualConcept}.
- Style: natural daylight, documentary realism, modern. Authentic adults, mostly women
- Colors: soft rose, beige, and burgundy accents. Subtle integrated overlays in brand colors allowed
- Never include text or logos`;
  };

  const response = await ai.generate({
    model: googleAI.model(IMAGE_GEN_MODEL),
    prompt: getImagePrompt(visualConcept),
  });

  if (!response.media?.url) {
    throw new Error('No valid image URL found in response');
  }

  return response.media.url;
}

/**
 * Generates a valid filename from a blog post title.
 */
function generateFilename(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-\.]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Downloads an image and uploads it to Vercel Blob storage.
 */
async function uploadImageToBlob(imageUrl: string, filename: string): Promise<string> {
  // Fetch the image
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Vercel Blob
  const blob = await put(`${filename}.png`, buffer, {
    access: 'public',
    contentType: 'image/png',
  });

  return blob.url;
}

/**
 * Main server action to generate images from blog post titles.
 */
export async function generateImages(prompts: string[]): Promise<GeneratedImage[]> {
  console.log(`Generating images for ${prompts.length} blog post(s)...`);

  const results: GeneratedImage[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const blogPostTitle = prompts[i];

    console.log(`[${i + 1}/${prompts.length}] Processing: "${blogPostTitle}"`);

    try {
      // Generate visual concept from blog title
      const visualConcept = await generateVisualConcept(blogPostTitle);
      console.log(`Visual concept: ${visualConcept}`);

      // Generate image from visual concept
      const imageUrl = await generateImage(visualConcept);

      // Generate filename from title
      const filename = generateFilename(blogPostTitle);

      // Upload to Vercel Blob storage
      const blobUrl = await uploadImageToBlob(imageUrl, filename);

      console.log(`✅ Image generated: ${blobUrl}`);

      results.push({
        url: blobUrl,
        title: blogPostTitle,
      });
    } catch (error) {
      console.error(`❌ Error processing "${blogPostTitle}":`, error);
      // Continue with next title instead of failing completely
      continue;
    }
  }

  console.log('🎉 All blog post titles processed!');

  return results;
}
