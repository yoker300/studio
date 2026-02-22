'use client';

import { useState, useContext, useRef } from 'react';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRecipeFromImage } from '@/ai/flows/ai-generate-recipe-from-image';
import Image from 'next/image';

const GenerateRecipeFromImageView = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(AppContext);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!context) return null;
  const { navigate, setGeneratedRecipe } = context;

  const handleGenerate = async () => {
    if (!imageUri) {
      toast({ variant: 'destructive', title: 'No image selected' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateRecipeFromImage({ imageDataUri: imageUri });
      setGeneratedRecipe(result);
      navigate({ type: 'editRecipe' });
    } catch (error) {
      console.error("AI recipe generation from image failed:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate a recipe from the image.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageRemove = () => {
      setImageUri(null);
  }

  return (
    <div className="p-4">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate({ type: 'recipes' })}>
          <ArrowLeft />
        </Button>
        <h1 className="text-4xl font-headline font-bold">Recipe from Picture</h1>
      </header>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles /> AI Recipe Scanner</CardTitle>
          <CardDescription>Upload a photo of a recipe, and Gemini will scan it for you.</CardDescription>
        </CardHeader>
        <CardContent>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {imageUri ? (
                <div className="mt-2 relative">
                  <Image src={imageUri} alt="Recipe Preview" width={400} height={400} className="rounded-md w-full h-auto max-h-64 object-contain bg-muted" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={handleImageRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
            ) : (
                <Button type="button" variant="outline" className="mt-2 w-full h-32" onClick={handleUploadClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                </Button>
            )}

        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleGenerate} disabled={isLoading || !imageUri}>
            {isLoading ? 'Generating...' : 'Generate Recipe'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GenerateRecipeFromImageView;
