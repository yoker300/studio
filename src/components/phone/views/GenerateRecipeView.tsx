'use client';

import { useState, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRecipe } from '@/ai/flows/ai-generate-recipe';

const GenerateRecipeView = () => {
  const [recipeName, setRecipeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(AppContext);
  const { toast } = useToast();

  if (!context) return null;
  const { navigate, setGeneratedRecipe } = context;

  const handleGenerate = async () => {
    if (!recipeName.trim()) {
      toast({ variant: 'destructive', title: 'Recipe name is empty' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateRecipe({ recipeName });
      setGeneratedRecipe(result);
      navigate({ type: 'editRecipe' });
    } catch (error) {
      console.error("AI recipe generation failed:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate the recipe.",
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
        <h1 className="text-4xl font-headline font-bold">Generate Recipe</h1>
      </header>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles /> AI Recipe Generator</CardTitle>
          <CardDescription>Enter the name of a dish, and Gemini will create a recipe for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="recipe-name" className="text-sm font-medium">Recipe Name</label>
            <Input
              id="recipe-name"
              placeholder="e.g., Chocolate Chip Cookies"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
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

export default GenerateRecipeView;
