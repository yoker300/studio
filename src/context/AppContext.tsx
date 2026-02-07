'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { List, Recipe, Settings, Item, View } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // Let's use uuid for id generation
import { processItem } from '@/ai/flows/ai-process-item';
import { GenerateRecipeOutput } from '@/ai/flows/ai-generate-recipe';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  textSize: 'normal',
  username: 'Smart Shopper',
  email: 'user@example.com',
  smartQuantities: [
    { itemName: 'Eggs', quantities: [6, 12, 18] },
    { itemName: 'Water', quantities: [6, 12, 24] },
  ],
  storePresets: ['SuperMart', 'GroceryHub', 'FreshCo', 'PantryPlus'],
};

const DUMMY_RECIPES: Recipe[] = [
    {
      id: 'recipe-1', name: 'Spaghetti Bolognese', icon: '🍝', image: 'https://picsum.photos/seed/recipe1/600/400',
      ingredients: [
        { id: uuidv4(), name: 'Ground Beef', qty: 1, category: 'Meat', checked: false, notes: '80/20 lean', store: '', urgent: false, gf: true, icon: '🥩' },
        { id: uuidv4(), name: 'Spaghetti', qty: 1, category: 'Pantry', checked: false, notes: 'box', store: '', urgent: false, gf: false, icon: '🍝' },
        { id: uuidv4(), name: 'Tomato Sauce', qty: 1, category: 'Pantry', checked: false, notes: '24oz can', store: '', urgent: false, gf: true, icon: '🥫' },
        { id: uuidv4(), name: 'Onion', qty: 1, category: 'Produce', checked: false, notes: '', store: '', urgent: false, gf: true, icon: '🧅' },
      ],
    },
    {
      id: 'recipe-2', name: 'Sushi', icon: '🍣', image: 'https://picsum.photos/seed/sushi/600/400',
      ingredients: [
        { id: uuidv4(), name: 'Sushi Rice', qty: 2, category: 'Pantry', checked: false, notes: 'cups', store: '', urgent: false, gf: true, icon: '🍚' },
        { id: uuidv4(), name: 'Nori', qty: 5, category: 'Pantry', checked: false, notes: 'sheets', store: '', urgent: false, gf: true, icon: '🌿' },
        { id: uuidv4(), name: 'Tuna', qty: 1, category: 'Seafood', checked: false, notes: 'sushi-grade', store: '', urgent: false, gf: true, icon: '🐟' },
        { id: uuidv4(), name: 'Avocado', qty: 1, category: 'Produce', checked: false, notes: '', store: '', urgent: false, gf: true, icon: '🥑' },
      ],
    }
];

type AppContextType = {
  lists: List[];
  recipes: Recipe[];
  settings: Settings;
  currentView: View;
  activeTab: 'lists' | 'recipes' | 'settings';
  urgentMode: boolean;
  generatedRecipe: GenerateRecipeOutput | null;
  navigate: (view: View) => void;
  vibrate: () => void;
  addList: (name: string, icon: string) => void;
  updateList: (id: string, name: string, icon: string) => void;
  deleteList: (id: string) => void;
  addItemToList: (listId: string, item: Omit<Item, 'id' | 'checked'>) => Promise<void>;
  addSmartItemToList: (listId: string, item: Omit<Item, 'id' | 'checked' | 'canonicalName'> & { canonicalName?: string }) => Promise<void>;
  updateItemInList: (listId: string, item: Item) => Promise<void>;
  deleteItemInList: (listId: string, itemId: string) => void;
  toggleItemChecked: (listId: string, itemId: string) => void;
  setUrgentMode: (active: boolean) => void;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  addRecipeToList: (recipeId: string, listId: string) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  setGeneratedRecipe: (recipe: GenerateRecipeOutput | null) => void;
  clearGeneratedRecipe: () => void;
};

export const AppContext = createContext<AppContextType | null>(null);

function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}


export function AppProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = usePersistentState<List[]>('smartlist_lists', []);
  const [recipes, setRecipes] = usePersistentState<Recipe[]>('smartlist_recipes', DUMMY_RECIPES);
  const [settings, setSettings] = usePersistentState<Settings>('smartlist_settings', DEFAULT_SETTINGS);
  const [currentView, setCurrentView] = useState<View>({ type: 'lists' });
  const [urgentMode, setUrgentMode] = usePersistentState('smartlist_urgentMode', false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GenerateRecipeOutput | null>(null);
  const { toast } = useToast();

  const activeTab = currentView.type.includes('list') ? 'lists' : currentView.type.includes('recipe') ? 'recipes' : 'settings';
  
  const vibrate = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const navigate = (view: View) => {
    vibrate();
    setCurrentView(view);
  };

  const clearGeneratedRecipe = () => {
    setGeneratedRecipe(null);
  };

  const addList = (name: string, icon: string) => {
    vibrate();
    const newList: List = { id: uuidv4(), name, icon, items: [] };
    setLists([...lists, newList]);
    navigate({type: 'listDetail', listId: newList.id});
  };

  const updateList = (id: string, name: string, icon: string) => {
    vibrate();
    setLists(lists.map(list => list.id === id ? { ...list, name, icon } : list));
  }

  const deleteList = (id: string) => {
    vibrate();
    setLists(lists.filter(list => list.id !== id));
    navigate({ type: 'lists' });
  }

  const runItemProcessing = async (item: Omit<Item, 'id'>): Promise<Item> => {
    try {
      const processed = await processItem({ name: item.name });
      return {
        id: uuidv4(),
        ...item,
        name: processed.name,
        canonicalName: processed.canonicalName,
        category: processed.category,
        icon: processed.icon,
      };
    } catch (e) {
      console.error("AI item processing failed:", e);
      toast({
        variant: "destructive",
        title: "AI Processing Failed",
        description: "Could not process item details. Using original values.",
      });
      // Fallback to a non-AI generated item
      return { id: uuidv4(), ...item, canonicalName: item.name, category: item.category || 'Other', icon: item.icon || '🛒' };
    }
  };

  const addSmartItemToList = async (listId: string, itemData: Omit<Item, 'id' | 'checked' | 'canonicalName'> & { canonicalName?: string }) => {
    vibrate();
    const newItem: Item = { ...itemData, id: uuidv4(), checked: false, canonicalName: itemData.canonicalName || itemData.name };

    setLists(prevLists => prevLists.map(list => {
      if (list.id !== listId) {
        return list;
      }

      const newItems = [...list.items];

      const representativeItem = newItems.find(i => i.canonicalName === newItem.canonicalName);
      const targetCategory = representativeItem ? representativeItem.category : newItem.category;
      newItem.category = targetCategory;

      const mergeCandidateIndex = newItems.findIndex(
          i => i.canonicalName === newItem.canonicalName && i.notes === newItem.notes && !i.checked
      );

      if (mergeCandidateIndex > -1) {
          const existingItem = newItems[mergeCandidateIndex];
          newItems[mergeCandidateIndex] = {
              ...existingItem,
              qty: existingItem.qty + newItem.qty,
              urgent: existingItem.urgent || newItem.urgent,
          };
      } else {
          newItems.push(newItem);
      }

      const finalCategory = (newItems.find(i => i.canonicalName === newItem.canonicalName) || newItem).category;
      const syncedItems = newItems.map(i => 
          i.canonicalName === newItem.canonicalName ? { ...i, category: finalCategory } : i
      );

      return { ...list, items: syncedItems };
    }));
  };

  const addItemToList = async (listId: string, itemData: Omit<Item, 'id' | 'checked'>) => {
    vibrate();
    const processedItem = await runItemProcessing({ ...itemData, checked: false });

    setLists(lists => lists.map(list => {
      if (list.id !== listId) {
        return list;
      }

      const newItems = [...list.items];

      const representativeItem = newItems.find(i => i.canonicalName === processedItem.canonicalName);
      const targetCategory = representativeItem ? representativeItem.category : processedItem.category;
      processedItem.category = targetCategory;

      const mergeCandidateIndex = newItems.findIndex(
        i => i.canonicalName === processedItem.canonicalName && i.notes === processedItem.notes && !i.checked
      );

      if (mergeCandidateIndex > -1) {
        const existingItem = newItems[mergeCandidateIndex];
        newItems[mergeCandidateIndex] = {
          ...existingItem,
          qty: existingItem.qty + processedItem.qty,
          urgent: existingItem.urgent || processedItem.urgent,
        };
      } else {
        newItems.push(processedItem);
      }
      
      const finalCategory = (newItems.find(i => i.canonicalName === processedItem.canonicalName) || processedItem).category;
      const syncedItems = newItems.map(i => 
          i.canonicalName === processedItem.canonicalName ? { ...i, category: finalCategory } : i
      );

      return { ...list, items: syncedItems };
    }));
  };

  const updateItemInList = async (listId: string, updatedItem: Item) => {
    vibrate();
    const processedItem = await runItemProcessing(updatedItem);

    setLists(lists => lists.map(list => {
      if (list.id !== listId) {
        return list;
      }
      
      const itemsWithoutOriginal = list.items.filter(i => i.id !== updatedItem.id);
      const newItems = [...itemsWithoutOriginal];

      const representativeItem = newItems.find(i => i.canonicalName === processedItem.canonicalName);
      const targetCategory = representativeItem ? representativeItem.category : processedItem.category;
      processedItem.category = targetCategory;

      const mergeCandidateIndex = newItems.findIndex(
        i => i.canonicalName === processedItem.canonicalName && i.notes === processedItem.notes && !i.checked
      );

      if (mergeCandidateIndex > -1) {
        const existingItem = newItems[mergeCandidateIndex];
        newItems[mergeCandidateIndex] = {
          ...existingItem,
          qty: existingItem.qty + processedItem.qty,
          urgent: existingItem.urgent || processedItem.urgent,
        };
      } else {
        newItems.push({ ...processedItem, id: updatedItem.id, checked: updatedItem.checked });
      }

      const finalCategory = (newItems.find(i => i.canonicalName === processedItem.canonicalName) || processedItem).category;
      const syncedItems = newItems.map(i => 
        i.canonicalName === processedItem.canonicalName ? { ...i, category: finalCategory } : i
      );

      return { ...list, items: syncedItems };
    }));
  };

  const deleteItemInList = (listId: string, itemId: string) => {
    vibrate();
    setLists(lists.map(list => {
      if (list.id === listId) {
        return { ...list, items: list.items.filter(item => item.id !== itemId) };
      }
      return list;
    }));
  }

  const toggleItemChecked = (listId: string, itemId: string) => {
    vibrate();
    setLists(lists.map(list => {
      if (list.id === listId) {
        return { ...list, items: list.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item) };
      }
      return list;
    }));
  }

  const addRecipe = (recipe: Omit<Recipe, 'id'>) => {
    vibrate();
    const newRecipe = { ...recipe, id: uuidv4() };
    setRecipes([...recipes, newRecipe]);
    navigate({ type: 'recipeDetail', recipeId: newRecipe.id });
  };
  
  const updateRecipe = (updatedRecipe: Recipe) => {
    vibrate();
    setRecipes(recipes.map(recipe => recipe.id === updatedRecipe.id ? updatedRecipe : recipe));
    navigate({ type: 'recipeDetail', recipeId: updatedRecipe.id });
  };

  const deleteRecipe = (recipeId: string) => {
    vibrate();
    setRecipes(recipes.filter(r => r.id !== recipeId));
    navigate({ type: 'recipes' });
  };

  const addRecipeToList = (recipeId: string, listId: string) => {
    vibrate();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
  
    // Use a function with setLists to ensure we have the latest list state
    setLists(currentLists => {
      const targetList = currentLists.find(l => l.id === listId);
      if (!targetList) return currentLists;
  
      let updatedList = { ...targetList };
  
      recipe.ingredients.forEach(ingredient => {
        const itemToAdd: Item = { 
          ...ingredient, 
          id: uuidv4(), 
          checked: false, 
          canonicalName: ingredient.canonicalName || ingredient.name // Ensure canonicalName
        };
  
        const newItems = [...updatedList.items];
        
        const representativeItem = newItems.find(i => i.canonicalName === itemToAdd.canonicalName);
        const targetCategory = representativeItem ? representativeItem.category : itemToAdd.category || 'Other';
  
        const mergeCandidateIndex = newItems.findIndex(
          i => i.canonicalName === itemToAdd.canonicalName && i.notes === itemToAdd.notes && !i.checked
        );
  
        if (mergeCandidateIndex > -1) {
          const existingItem = newItems[mergeCandidateIndex];
          newItems[mergeCandidateIndex] = {
            ...existingItem,
            qty: existingItem.qty + itemToAdd.qty,
            urgent: existingItem.urgent || itemToAdd.urgent,
            category: targetCategory, // Sync category
          };
        } else {
          newItems.push({ ...itemToAdd, category: targetCategory });
        }
  
        updatedList.items = newItems;
      });
  
      toast({ title: "Recipe Added", description: `Ingredients from ${recipe.name} were added to your list.` });
      navigate({ type: 'listDetail', listId });
      
      return currentLists.map(list => list.id === listId ? updatedList : list);
    });
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    vibrate();
    setSettings(prev => ({...prev, ...newSettings}));
  }

  const value: AppContextType = {
    lists,
    recipes,
    settings,
    currentView,
    activeTab,
    urgentMode,
    generatedRecipe,
    navigate,
    vibrate,
    addList,
    updateList,
    deleteList,
    addItemToList,
    addSmartItemToList,
    updateItemInList,
    deleteItemInList,
    toggleItemChecked,
    setUrgentMode,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addRecipeToList,
    updateSettings,
    setGeneratedRecipe,
    clearGeneratedRecipe,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
