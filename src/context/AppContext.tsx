'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { List, Recipe, Settings, Item, View } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // Let's use uuid for id generation
import { autoCorrectItem } from '@/ai/flows/ai-auto-correct-item';
import { GenerateRecipeOutput } from '@/ai/flows/ai-generate-recipe';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nProvider';
import { translations } from '@/i18n/translations';

const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  textSize: 'normal',
  language: 'en',
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
  t: (key: keyof typeof translations.en) => string;
  navigate: (view: View) => void;
  vibrate: () => void;
  addList: (name: string, icon: string) => void;
  updateList: (id: string, name: string, icon: string) => void;
  deleteList: (id: string) => void;
  addItemToList: (listId: string, item: Omit<Item, 'id' | 'checked'>) => Promise<void>;
  addSmartItemToList: (listId: string, item: Omit<Item, 'id' | 'checked'>) => Promise<void>;
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
  const { t, setLanguage, language } = useI18n();

  useEffect(() => {
    if (settings.language !== language) {
      setLanguage(settings.language);
      document.documentElement.lang = settings.language;
      document.documentElement.dir = settings.language === 'he' ? 'rtl' : 'ltr';
    }
  }, [settings.language, language, setLanguage]);

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

  const runAutoCorrect = async (item: Omit<Item, 'id'>): Promise<Item> => {
    try {
      const corrected = await autoCorrectItem({ name: item.name });
      return {
        id: uuidv4(),
        ...item,
        name: corrected.name,
        category: corrected.category,
        icon: corrected.icon,
      };
    } catch (e) {
      console.error("AI auto-correction failed:", e);
      toast({
        variant: "destructive",
        title: "AI Correction Failed",
        description: "Could not correct item details. Using original values.",
      });
      // Fallback to a non-AI generated item
      return { id: uuidv4(), ...item, category: item.category || 'Other', icon: item.icon || '🛒' };
    }
  };
  
  const addOrMergeItem = (list: List, itemToAdd: Item): List => {
    const existingItemIndex = list.items.findIndex(
      (item) => item.name.toLowerCase() === itemToAdd.name.toLowerCase() && !item.checked
    );

    if (existingItemIndex > -1) {
      // Merge with existing item
      const newItems = [...list.items];
      const existingItem = newItems[existingItemIndex];
      
      const combinedNotes = [existingItem.notes, itemToAdd.notes].filter(Boolean).join(', ');

      newItems[existingItemIndex] = {
        ...existingItem,
        qty: existingItem.qty + itemToAdd.qty,
        urgent: existingItem.urgent || itemToAdd.urgent,
        notes: combinedNotes,
        // Keep other properties from the existing item, but you could decide to update them
      };
      return { ...list, items: newItems };
    } else {
      // Add as new item
      return { ...list, items: [...list.items, itemToAdd] };
    }
  };


  const addSmartItemToList = async (listId: string, itemData: Omit<Item, 'id' | 'checked'>) => {
     vibrate();
     const newItem: Item = { ...itemData, id: uuidv4(), checked: false };
     setLists(prevLists => prevLists.map(list => {
       if (list.id === listId) {
         return addOrMergeItem(list, newItem);
       }
       return list;
     }));
  };

  const addItemToList = async (listId: string, itemData: Omit<Item, 'id' | 'checked'>) => {
    vibrate();
    const newItem = await runAutoCorrect(itemData);
    setLists(lists.map(list => {
      if (list.id === listId) {
        return addOrMergeItem(list, { ...newItem, checked: false });
      }
      return list;
    }));
  };

  const updateItemInList = async (listId: string, updatedItem: Item) => {
    vibrate();
    const correctedItem = await runAutoCorrect(updatedItem);
    setLists(lists.map(list => {
      if (list.id === listId) {
        return { ...list, items: list.items.map(item => item.id === updatedItem.id ? { ...correctedItem, id: updatedItem.id } : item) };
      }
      return list;
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
    const targetList = lists.find(l => l.id === listId);
    if (!recipe || !targetList) return;

    let updatedList = { ...targetList };
    recipe.ingredients.forEach(ingredient => {
      const itemToAdd: Item = { ...ingredient, id: uuidv4(), checked: false };
      updatedList = addOrMergeItem(updatedList, itemToAdd);
    });

    setLists(lists.map(list => list.id === listId ? updatedList : list));

    toast({ title: t('toastRecipeAddedTitle'), description: t('toastRecipeAddedDesc', { recipeName: recipe.name }) });
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
    t,
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
