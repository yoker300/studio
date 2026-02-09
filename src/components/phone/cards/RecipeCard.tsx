'use client';

import { useContext } from 'react';
import { Recipe } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { AppContext } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type RecipeCardProps = {
  recipe: Recipe;
};

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { navigate, users } = context;
  
  const owner = users.find(u => u.uid === recipe.ownerId);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => navigate({ type: 'recipeDetail', recipeId: recipe.id })}>
      <CardHeader className="p-0 relative">
         <Image
            src={recipe.image}
            alt={recipe.name}
            width={600}
            height={400}
            className="w-full h-32 object-cover"
            data-ai-hint="food recipe"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {owner && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={owner.photoURL} alt={owner.name} />
              <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          {recipe.collaborators.map(uid => {
            if (uid === recipe.ownerId) return null;
            const collaborator = users.find(u => u.uid === uid);
            if (!collaborator) return null;
            return (
              <Avatar key={uid} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={collaborator.photoURL} alt={collaborator.name} />
                <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
              </Avatar>
            );
          })}
        </div>
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
