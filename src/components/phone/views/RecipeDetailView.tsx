'use client';

import { useContext, useState } from 'react';
import Image from 'next/image';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Pencil, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';

type RecipeDetailViewProps = {
  recipeId: string;
};

const RecipeDetailView = ({ recipeId }: RecipeDetailViewProps) => {
  const context = useContext(AppContext);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const { toast } = useToast();

  const recipe = context?.recipes.find(r => r.id === recipeId);

  if (!context || !recipe) return (
    <div className="p-4">
      <Button variant="ghost" size="icon" className="mr-2" onClick={() => context?.navigate({ type: 'recipes' })}>
          <ArrowLeft />
      </Button>
      Recipe not found.
    </div>
  );

  const { navigate, lists, addRecipeToList, deleteRecipe } = context;

  const handleAddToList = () => {
    if (selectedListId) {
      addRecipeToList(recipeId, selectedListId);
    } else {
      toast({ variant: 'destructive', title: 'No List Selected', description: 'Please choose a list to add ingredients to.' });
    }
  };

  const handleEdit = () => {
     toast({ title: 'Coming Soon', description: 'Editing recipes will be available in a future update.' });
  }

  const handleDelete = () => {
    deleteRecipe(recipe.id);
  }

  return (
    <div>
      <div className="relative h-48">
        <Image
          src={recipe.image}
          alt={recipe.name}
          layout="fill"
          objectFit="cover"
          className="w-full"
          data-ai-hint="food recipe"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute top-2 left-2">
            <Button variant="ghost" size="icon" className="bg-background/50 rounded-full" onClick={() => navigate({ type: 'recipes' })}>
                <ArrowLeft />
            </Button>
        </div>
        <div className="absolute bottom-4 left-4">
            <h1 className="text-4xl font-headline font-bold">{recipe.icon} {recipe.name}</h1>
        </div>
         <div className="absolute top-2 right-2 flex gap-2">
            <Button variant="ghost" size="icon" className="bg-background/50 rounded-full" onClick={handleEdit}>
                <Pencil className="h-5 w-5"/>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="bg-background/50 rounded-full">
                    <Trash2 className="h-5 w-5"/>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the recipe for "{recipe.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-2xl font-headline font-semibold mb-2">Add to Shopping List</h2>
          <div className="flex gap-2">
            <Select onValueChange={setSelectedListId} defaultValue={lists[0]?.id}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent>
                {lists.map(list => (
                  <SelectItem key={list.id} value={list.id}>{list.icon} {list.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddToList} disabled={!lists.length}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
            {lists.length === 0 && <p className="text-sm text-muted-foreground mt-2">You need to create a shopping list first.</p>}
        </div>

        <div>
            <h2 className="text-2xl font-headline font-semibold mb-2">Ingredients</h2>
            <ul className="space-y-2">
            {recipe.ingredients.map(ing => (
                <li key={ing.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                    <span className="text-xl">{ing.icon || '🛒'}</span>
                    <div className="flex-1">
                        <span>{ing.name}</span>
                        {ing.notes && <span className="text-sm text-muted-foreground ml-2">({ing.notes})</span>}
                    </div>
                    <Badge variant="secondary">x{ing.qty}</Badge>
                </li>
            ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailView;
