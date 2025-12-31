'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import RecipeCard from '../cards/RecipeCard';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Sparkles, Pencil } from 'lucide-react';

const RecipesView = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { recipes, navigate } = context;
  
  const handleCreateRecipe = () => {
    navigate({ type: 'addRecipe' });
  }

  const handleManualCreate = () => {
    navigate({ type: 'editRecipe' });
  }

  return (
    <div className="p-4">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold">Recipes</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4"/> Create Recipe
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleCreateRecipe}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleManualCreate}>
              <Pencil className="mr-2 h-4 w-4" />
              Create Manually
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
