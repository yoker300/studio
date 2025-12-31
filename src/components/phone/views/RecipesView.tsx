'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import RecipeCard from '../cards/RecipeCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const RecipesView = () => {
  const context = useContext(AppContext);
  const { toast } = useToast();

  if (!context) return null;

  const { recipes } = context;
  
  const handleCreateRecipe = () => {
    toast({
      title: "Coming Soon!",
      description: "Creating new recipes is not yet implemented.",
    });
  }

  return (
    <div className="p-4">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold">Recipes</h1>
        <Button onClick={handleCreateRecipe}>
            <Plus className="mr-2 h-4 w-4"/> Create Recipe
        </Button>
      </header>
      
      {recipes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>You haven't saved any recipes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipesView;
