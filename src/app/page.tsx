'use client'

import Image from "next/image";
import { useState } from "react";
import { generateImages } from "./actions";
import { GeneratedImage } from "@/types";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    // Split by line breaks and filter out empty lines
    const prompts = prompt.split('\n').filter(line => line.trim() !== '');
    
    try {
      const generatedImages = await generateImages(prompts);
      setImages(generatedImages);
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.slice(0, 50).replace(/[^a-z0-9]/gi, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Calculate number of valid lines
  const validLineCount = prompt.split('\n').filter(line => line.trim() !== '').length;

  return (
    <div className="min-h-screen flex justify-center p-8 pt-16" style={{ backgroundColor: '#F5E6EB' }}>
      <div className="w-full max-w-xl lg:max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/endoapp-logo.png"
            alt="Endo App Logo"
            width={75}
            height={75}
            priority
            className="rounded-2xl drop-shadow-sm"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-[#692039]">Endo Health Blog Image Generator</h1>

        <p className="text-center text-gray-600 mb-8">Enter blog titles to generate images for your blog posts. One title per line.</p>

        {/* Textarea */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-4 bg-white rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A22A52] resize-none mb-3"
          rows={6}
          placeholder="Enter your prompts (one per line)..."
          disabled={isLoading}
          autoFocus
        />

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl text-white font-medium text-lg transition-opacity disabled:opacity-70 cursor-pointer"
          style={{ backgroundColor: '#A22A52' }}
        >
          {isLoading ? 'Generating...' : `Generate Images${validLineCount > 0 ? ` (${validLineCount})` : ''}`}
        </button>

        {/* Images Grid */}
        {(images.length > 0 || isLoading) && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2  gap-4">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg animate-pulse"
                  style={{ backgroundColor: '#D1D5DB' }}
                />
              ))
            ) : (
              // Actual images
              images.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer">
                  <Image
                    src={image.url}
                    alt={image.title}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                    <p className="text-white text-sm font-medium px-4 text-center mb-4 line-clamp-3">
                      {image.title}
                    </p>
                    <button
                      onClick={() => handleDownload(image.url, image.title)}
                      className="text-white hover:text-gray-200 transition-colors"
                      aria-label="Download image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-8 h-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
