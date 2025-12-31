'use client';

import { useState, useContext, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const ingredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ingredient name is required.'),
  qty: z.number().min(1),
  icon: z.string(),
  notes: z.string().optional(),
});

const recipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required.'),
  icon: z.string().min(1, 'Icon is required.'),
  image: z.string().url('Must be a valid URL.'),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required.'),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

type EditRecipeViewProps = {
  recipeId?: string;
};

const EditRecipeView = ({ recipeId }: EditRecipeViewProps) => {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const isEditing = !!recipeId;
  const recipe = context?.recipes.find(r => r.id === recipeId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      icon: '🍲',
      image: PlaceHolderImages[0]?.imageUrl || 'https://picsum.photos/seed/newrecipe/600/400',
      ingredients: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  useEffect(() => {
    if (isEditing && recipe) {
      const ingredientData = recipe.ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        qty: ing.qty,
        icon: ing.icon || '🛒',
        notes: ing.notes || '',
      }));
      reset({
        name: recipe.name,
        icon: recipe.icon,
        image: recipe.image,
        ingredients: ingredientData,
      });
    }
  }, [isEditing, recipe, reset]);

  if (!context) return null;
  const { addRecipe, updateRecipe, navigate } = context;

  const onSubmit = (data: RecipeFormData) => {
    const recipeData = {
      ...data,
      ingredients: data.ingredients.map(ing => ({
        ...ing,
        category: '', // Let AI handle this later
        checked: false,
        urgent: false,
        gf: false,
        store: '',
      })),
    };

    if (isEditing && recipeId) {
      updateRecipe({ ...recipeData, id: recipeId });
      toast({ title: 'Recipe Updated', description: `"${data.name}" has been saved.` });
    } else {
      addRecipe(recipeData);
      toast({ title: 'Recipe Created', description: `"${data.name}" has been added.` });
    }
  };
  
  const handleBack = () => {
    if (isEditing && recipeId) {
      navigate({ type: 'recipeDetail', recipeId });
    } else {
      navigate({ type: 'recipes' });
    }
  }

  return (
    <div className="p-4">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={handleBack}>
          <ArrowLeft />
        </Button>
        <h1 className="text-4xl font-headline font-bold">{isEditing ? 'Edit Recipe' : 'New Recipe'}</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Recipe Details</CardTitle>
            <CardDescription>Fill out the information for your recipe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="flex items-center gap-2">
              <Input {...register('icon')} className="text-3xl w-16 h-16 p-0 text-center bg-muted" maxLength={2} />
              <Input {...register('name')} placeholder="Recipe Name" className="text-2xl font-headline font-bold h-16 flex-1" />
            </div>
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            
            <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input {...register('image')} placeholder="https://example.com/image.jpg" />
                {errors.image && <p className="text-destructive text-sm">{errors.image.message}</p>}
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="text-lg font-medium mb-2">Ingredients</h3>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                     <Controller
                        control={control}
                        name={`ingredients.${index}.icon` as const}
                        render={({ field }) => <Input {...field} className="w-12 h-12 text-2xl text-center p-0" />}
                      />
                    <div className="flex-1 space-y-1">
                      <Controller
                        control={control}
                        name={`ingredients.${index}.name` as const}
                        render={({ field }) => <Input {...field} placeholder="Ingredient Name" />}
                      />
                       <Controller
                        control={control}
                        name={`ingredients.${index}.notes` as const}
                        render={({ field }) => <Input {...field} placeholder="Notes (e.g. 'diced')" className="text-xs h-7" />}
                      />
                    </div>
                     <Controller
                        control={control}
                        name={`ingredients.${index}.qty` as const}
                        render={({ field }) => <Input {...field} type="number" className="w-16" min={1} onChange={e => field.onChange(parseInt(e.target.value) || 1)}/>}
                      />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 {errors.ingredients && <p className="text-destructive text-sm">{errors.ingredients.message || errors.ingredients.root?.message}</p>}
              </div>
              <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => append({ id: uuidv4(), name: '', qty: 1, icon: '🛒', notes: '' })}>
                <Plus className="mr-2 h-4 w-4" /> Add Ingredient
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              {isEditing ? 'Save Changes' : 'Create Recipe'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default EditRecipeView;
