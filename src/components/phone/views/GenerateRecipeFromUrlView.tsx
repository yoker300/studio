'use client';

import { useState, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRecipeFromUrl } from '@/ai/flows/ai-generate-recipe-from-url';

const GenerateRecipeFromUrlView = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(AppContext);
  const { toast } = useToast();

  if (!context) return null;
  const { navigate, setGeneratedRecipe } = context;

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast({ variant: 'destructive', title: 'URL is empty' });
      return;
    }
    // Simple validation
    try {
        new URL(url);
    } catch (_) {
        toast({ variant: 'destructive', title: 'Invalid URL format' });
        return;
    }

    setIsLoading(true);
    try {
      const result = await generateRecipeFromUrl({ url });
      setGeneratedRecipe(result);
      navigate({ type: 'editRecipe' });
    } catch (error) {
      console.error("AI recipe generation from URL failed:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate a recipe from the URL. The site may be blocking scrapers or the format may be unsupported.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate({ type: 'recipes' })}>
          <ArrowLeft />
        </Button>
        <h1 className="text-4xl font-headline font-bold">Recipe from URL</h1>
      </header>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles /> AI Recipe Importer</CardTitle>
          <CardDescription>Paste the URL of a recipe webpage, and Gemini will import it.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="recipe-url" className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4"/> Recipe URL
            </label>
            <Input
              id="recipe-url"
              placeholder="https://example.com/best-cookies"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Recipe'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GenerateRecipeFromUrlView;
