'use client';

import { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { List, Recipe, Settings, Item, View, GenerateRecipeOutput, MergeProposal, UserProfile } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { processItem } from '@/ai/flows/ai-process-item';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, query, where } from 'firebase/firestore';

const DEFAULT_SETTINGS: Settings = {
  darkMode: false,
  textSize: 'normal',
  smartQuantities: [
    { itemName: 'Eggs', quantities: [6, 12, 18] },
    { itemName: 'Water', quantities: [6, 12, 24] },
  ],
  storePresets: ['SuperMart', 'GroceryHub', 'FreshCo', 'PantryPlus'],
};

type AppContextType = {
  lists: List[];
  recipes: Recipe[];
  settings: Settings;
  isDataLoading: boolean;
  currentView: View;
  activeTab: 'lists' | 'recipes' | 'settings';
  urgentMode: boolean;
  generatedRecipe: GenerateRecipeOutput | null;
  mergeProposal: MergeProposal | null;
  users: UserProfile[];
  navigate: (view: View) => void;
  vibrate: () => void;
  addList: (name: string, icon: string) => void;
  updateList: (id: string, name: string, icon: string) => void;
  deleteList: (id: string) => void;
  addItemToList: (listId: string, item: Omit<Item, 'id' | 'checked'>, skipProcessing?: boolean) => void;
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
  addCollaborator: (entityType: 'list' | 'recipe', entityId: string, email: string) => Promise<boolean>;
  removeCollaborator: (entityType: 'list' | 'recipe', entityId: string, userId: string) => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentView, setCurrentView] = useState<View>({ type: 'lists' });
  const [urgentMode, setUrgentMode] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [mergeProposal, setMergeProposal] = useState<MergeProposal | null>(null);
  const [pendingItemsQueue, setPendingItemsQueue] = useState<(Omit<Item, 'id' | 'checked'> & { listId: string; skipProcessing?: boolean })[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // --- Data Fetching ---
  const userOwnedListsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'lists'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const userCollaboratingListsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'lists'), where('collaborators', 'array-contains', user.uid)) : null, [firestore, user]);
  const userOwnedRecipesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'recipes'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const userCollaboratingRecipesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'recipes'), where('collaborators', 'array-contains', user.uid)) : null, [firestore, user]);
  const usersQuery = useMemoFirebase(() => user ? collection(firestore, 'users') : null, [firestore, user]);
  
  const settingsRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'settings', 'app_settings') : null, [firestore, user]);
  const { data: settingsData, isLoading: loadingSettings } = useDoc<Settings>(settingsRef);

  const { data: ownedLists, isLoading: loadingOwnedLists } = useCollection<List>(userOwnedListsQuery);
  const { data: collaboratingLists, isLoading: loadingCollabLists } = useCollection<List>(userCollaboratingListsQuery);
  const { data: ownedRecipes, isLoading: loadingOwnedRecipes } = useCollection<Recipe>(userOwnedRecipesQuery);
  const { data: collaboratingRecipes, isLoading: loadingCollabRecipes } = useCollection<Recipe>(userCollaboratingRecipesQuery);
  const { data: userProfiles, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  
  const lists = useMemo(() => {
    const allLists = new Map<string, List>();
    (ownedLists || []).forEach(list => allLists.set(list.id, list));
    (collaboratingLists || []).forEach(list => allLists.set(list.id, list));
    return Array.from(allLists.values());
  }, [ownedLists, collaboratingLists]);
  
  const recipes = useMemo(() => {
    const allRecipes = new Map<string, Recipe>();
    (ownedRecipes || []).forEach(recipe => allRecipes.set(recipe.id, recipe));
    (collaboratingRecipes || []).forEach(recipe => allRecipes.set(recipe.id, recipe));
    return Array.from(allRecipes.values());
  }, [ownedRecipes, collaboratingRecipes]);

  useEffect(() => {
    if (userProfiles) setUsers(userProfiles);
  }, [userProfiles]);
  
  // Effect to manage settings state from Firestore
  useEffect(() => {
    if (user) {
      if (settingsData === null && !loadingSettings) {
        // No settings doc exists, create one with defaults
        setDocumentNonBlocking(settingsRef!, DEFAULT_SETTINGS, { merge: true });
        setSettings(DEFAULT_SETTINGS);
      } else if (settingsData) {
        // Settings doc exists, merge with defaults to ensure all keys are present
        setSettings(prev => ({ ...prev, ...settingsData }));
      }
    } else {
        // No user, reset to default
        setSettings(DEFAULT_SETTINGS);
    }
  }, [settingsData, loadingSettings, user, settingsRef]);
  
  const isDataLoading = loadingOwnedLists || loadingCollabLists || loadingOwnedRecipes || loadingCollabRecipes || loadingUsers || isUserLoading || loadingSettings;

  const activeTab = currentView.type.includes('list') ? 'lists' : currentView.type.includes('recipe') ? 'recipes' : 'settings';

  const vibrate = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  }, []);

  const navigate = (view: View) => {
    vibrate();
    setCurrentView(view);
  };

  const clearGeneratedRecipe = () => setGeneratedRecipe(null);

  const addList = (name: string, icon: string) => {
    if (!user) return;
    vibrate();
    const newList: Omit<List, 'id'> = { name, icon, items: [], ownerId: user.uid, collaborators: [] };
    addDocumentNonBlocking(collection(firestore, 'lists'), newList).then(docRef => {
        if(docRef) navigate({type: 'listDetail', listId: docRef.id});
    });
  };

  const updateList = (id: string, name: string, icon: string) => {
    vibrate();
    updateDocumentNonBlocking(doc(firestore, 'lists', id), { name, icon });
  };

  const deleteList = (id: string) => {
    vibrate();
    deleteDocumentNonBlocking(doc(firestore, 'lists', id));
    navigate({ type: 'lists' });
  };
  
  const runItemProcessing = async (item: Omit<Item, 'id' | 'checked'>): Promise<Omit<Item, 'id' | 'checked'>> => {
    try {
      const processed = await processItem({ name: item.name, qty: item.qty, unit: item.unit });
      return { ...item, ...processed };
    } catch (e) {
      console.error("AI item processing failed:", e);
      return { ...item, name: item.name, canonicalName: item.name, category: item.category || 'Other', icon: item.icon || '🛒' };
    }
  };
  
  const _commitItemToList = (listId: string, itemData: Omit<Item, 'id' | 'checked'>) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const newItem: Item = { ...itemData, id: uuidv4(), checked: false, notes: (itemData.notes || '').trim(), store: (itemData.store || '').trim() };
    const updatedItems = [...list.items, newItem];
    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });
  };

  const _performMerge = (listId: string, existingItem: Item, newItemData: Omit<Item, 'id' | 'checked'>) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const updatedItems = list.items.map(i => i.id === existingItem.id ? { ...i, name: existingItem.name, qty: i.qty + newItemData.qty, urgent: i.urgent || newItemData.urgent, store: (existingItem.store || newItemData.store || '').trim() } : i);
    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });
  };

  const processItemsQueue = useCallback(() => {
    if (mergeProposal || pendingItemsQueue.length === 0) return;

    const [currentItem, ...restOfQueue] = pendingItemsQueue;
    setPendingItemsQueue(restOfQueue);
    
    const { listId, skipProcessing, ...itemData } = currentItem;

    const processAndAddItem = async () => {
        const newItem = skipProcessing ? { ...itemData, name: itemData.name, canonicalName: itemData.name, category: itemData.category || 'Other', icon: itemData.icon || '🛒' } : await runItemProcessing(itemData);
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const newItemNotes = (newItem.notes || '').trim();
        const newItemStore = (newItem.store || '').trim();

        const perfectMatch = list.items.find(i => !i.checked && i.canonicalName === newItem.canonicalName && i.unit === newItem.unit && (i.notes || '').trim() === newItemNotes && (i.store || '').trim() === newItemStore);
        if (perfectMatch) {
            _performMerge(listId, perfectMatch, newItem);
            processItemsQueue(); // Continue queue
            return;
        }

        const storeProposalMatch = list.items.find(i => !i.checked && i.canonicalName === newItem.canonicalName && i.unit === newItem.unit && (i.notes || '').trim() === newItemNotes && ((!!(i.store || '').trim() && !newItemStore) || (!((i.store || '').trim()) && !!newItemStore)));
        if (storeProposalMatch) {
            setMergeProposal({ existingItem: storeProposalMatch, newItemData: newItem, listId: listId });
            return; // Stop processing and wait for user
        }
        
        _commitItemToList(listId, newItem);
        processItemsQueue(); // Continue queue
    };

    processAndAddItem();
  }, [pendingItemsQueue, mergeProposal, lists, toast]);


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
    processItemsQueue(); // Continue queue
  };

  const declineMerge = (keepSeparate = true) => {
      if (!mergeProposal) return;
      const { listId, newItemData } = mergeProposal;
      if (keepSeparate) _commitItemToList(listId, newItemData);
      setMergeProposal(null);
      processItemsQueue(); // Continue queue
  };
  
  const addSmartItemToList = (listId: string, itemData: Omit<Item, 'id' | 'checked' | 'canonicalName'> & { canonicalName?: string }) => {
    setPendingItemsQueue(prev => [...prev, { ...itemData, listId }]);
  };
  
  const addItemToList = (listId: string, itemData: Omit<Item, 'id' | 'checked'>, skipProcessing = false) => {
    setPendingItemsQueue(prev => [...prev, { ...itemData, listId, skipProcessing }]);
  };

  const updateItemInList = (listId: string, updatedItem: Item) => {
    vibrate();
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    
    const updatedItems = list.items.filter(i => i.id !== updatedItem.id);
    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });

    const { id, checked, ...itemData } = updatedItem;
    setPendingItemsQueue(prev => [...prev, { ...itemData, listId }]);
  };
  
  const deleteItemInList = (listId: string, itemId: string) => {
    vibrate();
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const updatedItems = list.items.filter(item => item.id !== itemId);
    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });
  };

  const toggleItemChecked = (listId: string, itemId: string) => {
    vibrate();
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const updatedItems = list.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item);
    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });
  };

  const addRecipe = (recipe: Omit<Recipe, 'id'>) => {
    if (!user) return;
    vibrate();
    const newRecipe = { ...recipe, ownerId: user.uid, collaborators: [] };
    addDocumentNonBlocking(collection(firestore, 'recipes'), newRecipe).then(docRef => {
      if(docRef) navigate({ type: 'recipeDetail', recipeId: docRef.id });
    });
  };
  
  const updateRecipe = (updatedRecipe: Recipe) => {
    vibrate();
    updateDocumentNonBlocking(doc(firestore, 'recipes', updatedRecipe.id), updatedRecipe);
    navigate({ type: 'recipeDetail', recipeId: updatedRecipe.id });
  };

  const deleteRecipe = (recipeId: string) => {
    vibrate();
    deleteDocumentNonBlocking(doc(firestore, 'recipes', recipeId));
    navigate({ type: 'recipes' });
  };

  const addRecipeToList = (recipeId: string, listId: string) => {
    vibrate();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const itemsToQueue = recipe.ingredients.map(ingredient => ({ ...ingredient, listId, skipProcessing: true }));
    setPendingItemsQueue(prev => [...prev, ...itemsToQueue]);

    toast({ title: "Recipe Added", description: `Ingredients from ${recipe.name} will be added to your list.` });
    navigate({ type: 'listDetail', listId });
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    if (!settingsRef) return;
    vibrate();
    const updatedState = { ...settings, ...newSettings };
    setSettings(updatedState);
    setDocumentNonBlocking(settingsRef, updatedState, { merge: true });
  };
  
  const addCollaborator = async (entityType: 'list' | 'recipe', entityId: string, email: string): Promise<boolean> => {
    const targetUser = users.find(u => u.email === email);
    if (!targetUser) {
      toast({ variant: 'destructive', title: 'User not found' });
      return false;
    }
    
    const entityCollection = entityType === 'list' ? 'lists' : 'recipes';
    const entity = entityType === 'list' ? lists.find(e => e.id === entityId) : recipes.find(e => e.id === entityId);
    
    if (entity && !entity.collaborators.includes(targetUser.uid)) {
      const updatedCollaborators = [...entity.collaborators, targetUser.uid];
      updateDocumentNonBlocking(doc(firestore, entityCollection, entityId), { collaborators: updatedCollaborators });
      toast({ title: 'Collaborator Added' });
      return true;
    }
    return false;
  };
  
  const removeCollaborator = (entityType: 'list' | 'recipe', entityId: string, userId: string) => {
    const entityCollection = entityType === 'list' ? 'lists' : 'recipes';
    const entity = entityType === 'list' ? lists.find(e => e.id === entityId) : recipes.find(e => e.id === entityId);
    
    if (entity) {
      const updatedCollaborators = entity.collaborators.filter(id => id !== userId);
      updateDocumentNonBlocking(doc(firestore, entityCollection, entityId), { collaborators: updatedCollaborators });
      toast({ title: 'Collaborator Removed' });
    }
  };

  const value: AppContextType = {
    lists, recipes, settings, isDataLoading, currentView, activeTab, urgentMode, generatedRecipe, mergeProposal, users,
    navigate, vibrate, addList, updateList, deleteList, addItemToList, addSmartItemToList, updateItemInList, deleteItemInList,
    toggleItemChecked, setUrgentMode, addRecipe, updateRecipe, deleteRecipe, addRecipeToList, updateSettings, setGeneratedRecipe,
    clearGeneratedRecipe, confirmMerge, declineMerge, addCollaborator, removeCollaborator
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
