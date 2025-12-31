'use client';

import { useContext } from 'react';
import { Recipe } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { AppContext } from '@/context/AppContext';

type RecipeCardProps = {
  recipe: Recipe;
};

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { navigate } = context;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => navigate({ type: 'recipeDetail', recipeId: recipe.id })}>
      <CardHeader className="p-0">
         <Image
            src={recipe.image}
            alt={recipe.name}
            width={600}
            height={400}
            className="w-full h-32 object-cover"
            data-ai-hint="food recipe"
        />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="font-headline text-xl">{recipe.icon} {recipe.name}</CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">{recipe.ingredients.length} ingredients</p>
      </CardFooter>
    </Card>
  );
};

export default RecipeCard;
