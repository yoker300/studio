'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { List, Recipe, Settings, Item, View, GenerateRecipeOutput, MergeProposal } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // Let's use uuid for id generation
import { processItem } from '@/ai/flows/ai-process-item';
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
  mergeProposal: MergeProposal | null;
  navigate: (view: View) => void;
  vibrate: () => void;
  addList: (name: string, icon: string) => void;
  updateList: (id: string, name: string, icon: string) => void;
  deleteList: (id: string) => void;
  addItemToList: (listId: string, item: Omit<Item, 'id' | 'checked'>) => void;
  addSmartItemToList: (listId: string, item: Omit<Item, 'id' | 'checked' | 'canonicalName'> & { canonicalName?: string }) => void;
  updateItemInList: (listId: string, item: Item) => void;
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
  confirmMerge: () => void;
  declineMerge: (keepSeparate?: boolean) => void;
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
  
  const [mergeProposal, setMergeProposal] = useState<MergeProposal | null>(null);
  const [pendingItemsQueue, setPendingItemsQueue] = useState<(Omit<Item, 'id' | 'checked'> & { listId: string; skipProcessing?: boolean })[]>([]);

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

  const runItemProcessing = async (item: Omit<Item, 'id' | 'checked'>): Promise<Omit<Item, 'id' | 'checked'>> => {
    try {
      const processed = await processItem({
        name: item.name,
        qty: item.qty,
        unit: item.unit,
       });
      return {
        ...item,
        name: processed.name,
        canonicalName: processed.canonicalName,
        category: processed.category,
        icon: processed.icon,
        qty: processed.qty,
        unit: processed.unit,
      };
    } catch (e) {
      console.error("AI item processing failed:", e);
      toast({
        variant: "destructive",
        title: "AI Processing Failed",
        description: "Could not process item details. Using original values.",
      });
      return { 
        ...item, 
        canonicalName: item.name, 
        category: item.category || 'Other', 
        icon: item.icon || '🛒',
      };
    }
  };

  const _commitItemToList = (listId: string, itemData: Omit<Item, 'id' | 'checked'>) => {
    const newItem: Item = {
      ...itemData,
      id: uuidv4(),
      checked: false,
      notes: (itemData.notes || '').trim(),
      store: (itemData.store || '').trim(),
    };
    
    setLists(prevLists => {
        const listIndex = prevLists.findIndex(l => l.id === listId);
        if (listIndex === -1) return prevLists;

        const currentList = prevLists[listIndex];
        const updatedList = { ...currentList, items: [...currentList.items, newItem] };
        const newLists = [...prevLists];
        newLists[listIndex] = updatedList;
        return newLists;
    });
  };

  const _performMerge = (listId: string, existingItem: Item, newItemData: Omit<Item, 'id' | 'checked'>) => {
      setLists(prevLists => {
          const listIndex = prevLists.findIndex(l => l.id === listId);
          if (listIndex === -1) return prevLists;
          
          const currentList = prevLists[listIndex];
          const updatedItems = currentList.items.map(i => {
              if (i.id === existingItem.id) {
                  return {
                      ...i,
                      qty: i.qty + newItemData.qty,
                      urgent: i.urgent || newItemData.urgent,
                      store: (i.store || newItemData.store || '').trim(),
                  };
              }
              return i;
          });

          const updatedList = { ...currentList, items: updatedItems };
          const newLists = [...prevLists];
          newLists[listIndex] = updatedList;
          return newLists;
      });
  };

  const processItemsQueue = useCallback(() => {
    if (mergeProposal || pendingItemsQueue.length === 0) {
      return;
    }

    const [currentItem, ...restOfQueue] = pendingItemsQueue;
    setPendingItemsQueue(restOfQueue);
    
    const { listId, ...itemData } = currentItem;

    const processAndAddItem = async () => {
        const newItem = currentItem.skipProcessing
            ? itemData
            : await runItemProcessing(itemData);

        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const newItemNotes = (newItem.notes || '').trim();
        const newItemStore = (newItem.store || '').trim();

        // 1. Perfect Match Check
        const perfectMatch = list.items.find(i => 
            !i.checked &&
            i.canonicalName === newItem.canonicalName &&
            i.unit === newItem.unit &&
            (i.notes || '').trim() === newItemNotes &&
            (i.store || '').trim() === newItemStore
        );

        if (perfectMatch) {
            _performMerge(listId, perfectMatch, newItem);
            return;
        }

        // 2. Store Merge Proposal Check
        const storeProposalMatch = list.items.find(i =>
            !i.checked &&
            i.canonicalName === newItem.canonicalName &&
            i.unit === newItem.unit &&
            (i.notes || '').trim() === newItemNotes &&
            ((!!(i.store || '').trim() && !newItemStore) || (!((i.store || '').trim()) && !!newItemStore))
        );

        if (storeProposalMatch) {
            setMergeProposal({
                existingItem: storeProposalMatch,
                newItemData: newItem,
                listId: listId,
            });
            // Stop processing until user responds
            return;
        }

        // 3. No merge. Just add it.
        _commitItemToList(listId, newItem);
    };

    processAndAddItem().finally(() => {
        // After item is processed (and if no modal was shown), check queue again
        if (!mergeProposal) {
             setPendingItemsQueue(prev => {
                if (prev.length > 0) {
                    // Use timeout to avoid deep recursion issues
                    setTimeout(() => processItemsQueue(), 0);
                }
                return prev;
             });
        }
    });

  }, [pendingItemsQueue, mergeProposal, lists, runItemProcessing, toast]);

  useEffect(() => {
    if (pendingItemsQueue.length > 0 && !mergeProposal) {
        processItemsQueue();
    }
  }, [pendingItemsQueue, mergeProposal, processItemsQueue]);


  const confirmMerge = () => {
    if (!mergeProposal) return;
    const { listId, existingItem, newItemData } = mergeProposal;
    _performMerge(listId, existingItem, newItemData);
    setMergeProposal(null);
  };

  const declineMerge = (keepSeparate = true) => {
      if (!mergeProposal) return;
      const { listId, newItemData } = mergeProposal;
      if (keepSeparate) {
          _commitItemToList(listId, newItemData);
      }
      setMergeProposal(null);
  };

  const addSmartItemToList = (listId: string, itemData: Omit<Item, 'id' | 'checked' | 'canonicalName'> & { canonicalName?: string }) => {
      setPendingItemsQueue(prev => [...prev, { ...itemData, listId, skipProcessing: true }]);
  };
  
  const addItemToList = (listId: string, itemData: Omit<Item, 'id' | 'checked'>) => {
      setPendingItemsQueue(prev => [...prev, { ...itemData, listId, skipProcessing: false }]);
  };

  const updateItemInList = (listId: string, updatedItem: Item) => {
    vibrate();
    
    // Remove the original item from the list state
    setLists(prevLists => prevLists.map(list => 
        list.id === listId 
            ? { ...list, items: list.items.filter(i => i.id !== updatedItem.id) } 
            : list
    ));

    // Add the updated item to the queue to be re-processed for merges
    const { id, checked, ...itemData } = updatedItem;
    setPendingItemsQueue(prev => [...prev, { ...itemData, listId, skipProcessing: false }]);
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
    
    const itemsToQueue = recipe.ingredients.map(ingredient => ({
        ...ingredient,
        listId,
        skipProcessing: true,
    }));
    setPendingItemsQueue(prev => [...prev, ...itemsToQueue]);

    toast({ title: "Recipe Added", description: `Ingredients from ${recipe.name} will be added to your list.` });
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
    mergeProposal,
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
    confirmMerge,
    declineMerge,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
