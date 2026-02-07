'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { List, Recipe, Settings, Item, View, GenerateRecipeOutput } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // Let's use uuid for id generation
import { processItem } from '@/ai/flows/ai-process-item';
import { convertUnits } from '@/ai/flows/ai-convert-units';
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
  mergeBehavior: 'strict',
};

const DUMMY_RECIPES: Recipe[] = [
    {
      id: 'recipe-1', name: 'Spaghetti Bolognese', icon: '🍝', image: 'https://picsum.photos/seed/recipe1/600/400',
      ingredients: [
        { id: uuidv4(), name: 'Ground Beef', qty: 1, unit: 'lb', category: 'Meat', checked: false, notes: '80/20 lean', store: '', urgent: false, gf: true, icon: '🥩' },
        { id: uuidv4(), name: 'Spaghetti', qty: 1, unit: 'box', category: 'Pantry', checked: false, store: '', urgent: false, gf: false, icon: '🍝' },
        { id: uuidv4(), name: 'Tomato Sauce', qty: 24, unit: 'oz', category: 'Pantry', checked: false, store: '', urgent: false, gf: true, icon: '🥫' },
        { id: uuidv4(), name: 'Onion', qty: 1, category: 'Produce', checked: false, notes: 'diced', store: '', urgent: false, gf: true, icon: '🧅' },
      ],
    },
    {
      id: 'recipe-2', name: 'Sushi', icon: '🍣', image: 'https://picsum.photos/seed/sushi/600/400',
      ingredients: [
        { id: uuidv4(), name: 'Sushi Rice', qty: 2, unit: 'cups', category: 'Pantry', checked: false, store: '', urgent: false, gf: true, icon: '🍚' },
        { id: uuidv4(), name: 'Nori', qty: 5, unit: 'sheets', category: 'Pantry', checked: false, store: '', urgent: false, gf: true, icon: '🌿' },
        { id: uuidv4(), name: 'Tuna', qty: 1, unit: 'lb', category: 'Seafood', checked: false, notes: 'sushi-grade', store: '', urgent: false, gf: true, icon: '🐟' },
        { id: uuidv4(), name: 'Avocado', qty: 1, category: 'Produce', checked: false, store: '', urgent: false, gf: true, icon: '🥑' },
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
      return { id: uuidv4(), ...item, canonicalName: item.name, category: item.category || 'Other', icon: item.icon || '🛒' };
    }
  };

  const _addItemToList = async (listId: string, itemData: Omit<Item, 'id' | 'checked'>, skipProcessing = false) => {
    vibrate();
  
    const newItem = skipProcessing 
      ? { ...itemData, id: uuidv4(), checked: false, canonicalName: itemData.canonicalName || itemData.name } 
      : await runItemProcessing({ ...itemData, checked: false });
  
    setLists(prevLists => {
      const listIndex = prevLists.findIndex(l => l.id === listId);
      if (listIndex === -1) return prevLists;
  
      const currentList = prevLists[listIndex];
      let newItems = [...currentList.items];
  
      // Sync category with any existing items of the same kind
      const representativeItem = newItems.find(i => i.canonicalName === newItem.canonicalName);
      newItem.category = representativeItem?.category || newItem.category;
  
      const mergeCandidateIndex = newItems.findIndex(i => 
        !i.checked &&
        i.canonicalName === newItem.canonicalName &&
        i.notes === newItem.notes
      );
  
      let merged = false;
      if (mergeCandidateIndex > -1) {
        const candidate = newItems[mergeCandidateIndex];
  
        if (settings.mergeBehavior === 'strict') {
          if (candidate.unit === newItem.unit) {
            candidate.qty += newItem.qty;
            candidate.urgent = candidate.urgent || newItem.urgent;
            merged = true;
          }
        } else { // 'smart' merge
          const [newItemConv, candConv] = await Promise.all([
            convertUnits({ name: newItem.name, qty: newItem.qty, unit: newItem.unit }),
            convertUnits({ name: candidate.name, qty: candidate.qty, unit: candidate.unit })
          ]);
  
          if (!newItemConv.error && !candConv.error && newItemConv.unit === candConv.unit) {
            candidate.qty = (newItemConv.qty || 0) + (candConv.qty || 0);
            candidate.unit = newItemConv.unit;
            candidate.urgent = candidate.urgent || newItem.urgent;
            merged = true;
          }
        }
      }
  
      if (!merged) {
        newItems.push(newItem);
      }
      
      const finalCategory = (newItems.find(i => i.canonicalName === newItem.canonicalName) || newItem).category;
      const syncedItems = newItems.map(i => 
        i.canonicalName === newItem.canonicalName ? { ...i, category: finalCategory } : i
      );
  
      const updatedList = { ...currentList, items: syncedItems };
      const newLists = [...prevLists];
      newLists[listIndex] = updatedList;
      return newLists;
    });
  };

  const addSmartItemToList = async (listId: string, itemData: Omit<Item, 'id' | 'checked' | 'canonicalName'> & { canonicalName?: string }) => {
    await _addItemToList(listId, itemData, true);
  };
  
  const addItemToList = async (listId: string, itemData: Omit<Item, 'id' | 'checked'>) => {
    await _addItemToList(listId, itemData, false);
  };

  const updateItemInList = async (listId: string, updatedItem: Item) => {
    vibrate();
  
    setLists(prevLists => {
      const listIndex = prevLists.findIndex(l => l.id === listId);
      if (listIndex === -1) return prevLists;
  
      const currentList = prevLists[listIndex];
      // Temporarily remove the item to be updated
      const itemsWithoutOriginal = currentList.items.filter(i => i.id !== updatedItem.id);
      
      const newLists = [...prevLists];
      newLists[listIndex] = { ...currentList, items: itemsWithoutOriginal };
      return newLists;
    });

    await addItemToList(listId, { ...updatedItem });
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

    recipe.ingredients.forEach(ingredient => {
      _addItemToList(listId, { 
        ...ingredient,
        canonicalName: ingredient.canonicalName || ingredient.name
      }, true);
    });

    toast({ title: "Recipe Added", description: `Ingredients from ${recipe.name} were added to your list.` });
    navigate({ type: 'listDetail', listId });
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
