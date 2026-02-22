'use client';

import { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { List, Recipe, Settings, Item, View, GenerateRecipeOutput, MergeProposal, UserProfile } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, query, where, getDocs, writeBatch, arrayUnion, getDoc, Firestore } from 'firebase/firestore';

const DEFAULT_SETTINGS: Settings = {
  darkMode: false,
  textSize: 'normal',
  smartQuantities: [
    { itemName: 'Eggs', quantities: [6, 12, 18] },
    { itemName: 'Water', quantities: [6, 12, 24] },
  ],
  storePresets: ['שופרסל', 'חצי חינם', 'רמי לוי', 'אושר עד'],
};

// --- Local Helper Functions for DB operations ---

const _commitItemToList = (firestore: Firestore, listId: string, list: List, itemData: Omit<Item, 'id' | 'checked'>) => {
    const newItem: Item = { ...itemData, id: uuidv4(), checked: false, notes: (itemData.notes || '').trim(), store: (itemData.store || '').trim() };
    const updatedItems = [...list.items, newItem];
    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });
};

const _performMerge = (firestore: Firestore, listId: string, list: List, existingItem: Item, newItemData: Omit<Item, 'id' | 'checked'>) => {
    const updatedItems = list.items.map(i => {
        if (i.id === existingItem.id) {
            const combinedNotes = [existingItem.notes, newItemData.notes].filter(Boolean).join(', ');
            const combinedStore = [existingItem.store, newItemData.store].filter(Boolean).join(', ');

            return {
                ...i, // Start with the existing item's base properties (id, checked status)
                name: existingItem.name, // Keep original name
                icon: existingItem.icon, // Keep original icon
                qty: i.qty + (newItemData.qty || 0),
                urgent: i.urgent || newItemData.urgent,
                notes: combinedNotes,
                store: combinedStore,
                unit: i.unit || newItemData.unit, // Keep existing unit, fallback to new
                gf: i.gf || newItemData.gf,
            };
        }
        return i;
    });
    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });
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
  
  const settingsRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'settings', 'app_settings') : null, [firestore, user]);
  const { data: settingsData, isLoading: loadingSettings } = useDoc<Settings>(settingsRef);

  const { data: ownedLists, isLoading: loadingOwnedLists } = useCollection<List>(userOwnedListsQuery);
  const { data: collaboratingLists, isLoading: loadingCollabLists } = useCollection<List>(userCollaboratingListsQuery);
  const { data: ownedRecipes, isLoading: loadingOwnedRecipes } = useCollection<Recipe>(userOwnedRecipesQuery);
  const { data: collaboratingRecipes, isLoading: loadingCollabRecipes } = useCollection<Recipe>(userCollaboratingRecipesQuery);
  
  const isDataLoading = loadingOwnedLists || loadingCollabLists || loadingOwnedRecipes || loadingCollabRecipes || isUserLoading || loadingSettings;
  
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
  
  // Fetch profiles for all collaborators across all lists and recipes
  useEffect(() => {
    if (!user || isUserLoading) return;
    const allUserIds = new Set<string>();

    lists.forEach(list => {
      allUserIds.add(list.ownerId);
      list.collaborators.forEach(id => allUserIds.add(id));
    });
    recipes.forEach(recipe => {
      allUserIds.add(recipe.ownerId);
      recipe.collaborators.forEach(id => allUserIds.add(id));
    });
    
    // Always include the current user
    allUserIds.add(user.uid);

    const ids = Array.from(allUserIds);
    if (ids.length === 0) {
      setUsers([]);
      return;
    }
    
    const fetchUsers = async () => {
      const usersRef = collection(firestore, 'users');
      const userChunks: UserProfile[] = [];
      for (let i = 0; i < ids.length; i += 30) {
          const chunk = ids.slice(i, i + 30);
          const q = query(usersRef, where('uid', 'in', chunk));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
              userChunks.push(doc.data() as UserProfile);
          });
      }
      setUsers(userChunks);
    };

    fetchUsers().catch(console.error);
  }, [lists, recipes, firestore, user, isUserLoading]);

  // Effect to manage settings state from Firestore
  useEffect(() => {
    if (user) {
      if (settingsData === null && !loadingSettings) {
        setDocumentNonBlocking(settingsRef!, DEFAULT_SETTINGS, { merge: true });
        setSettings(DEFAULT_SETTINGS);
      } else if (settingsData) {
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...settingsData }));
      }
    } else {
        setSettings(DEFAULT_SETTINGS);
    }
  }, [settingsData, loadingSettings, user, settingsRef]);
  
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
      const response = await fetch('/api/process-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: item.name, qty: item.qty, unit: item.unit }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const processed = await response.json();
      return { ...item, ...processed };

    } catch (e) {
      console.error("AI item processing failed:", e);
      // Re-throw so the calling function knows about the failure.
      throw new Error('AI processing failed');
    }
  };
  
  useEffect(() => {
    if (pendingItemsQueue.length === 0 || mergeProposal || !firestore) {
      return;
    }

    let isMounted = true;

    const processNextItem = async () => {
      const currentItem = pendingItemsQueue[0]; // Peek at the item, don't dequeue yet
      if (!currentItem) return;

      try {
        const { listId, skipProcessing, ...itemData } = currentItem;

        const newItemData = skipProcessing 
          ? { ...itemData, name: itemData.name, canonicalName: itemData.canonicalName || itemData.name, category: itemData.category || 'Other', icon: itemData.icon || '🛒' } 
          : await runItemProcessing(itemData);

        const listRef = doc(firestore, 'lists', listId);
        const listSnap = await getDoc(listRef);

        if (!listSnap.exists()) {
          console.warn(`List ${listId} not found for item processing, removing item from queue.`);
          toast({ title: 'List Not Found', description: `Could not add "${itemData.name}" because the list no longer exists.`, variant: 'destructive'});
          if (isMounted) {
            setPendingItemsQueue(prev => prev.slice(1)); // Dequeue failed item
          }
          return;
        }

        const list = { ...listSnap.data(), id: listSnap.id } as List;
        const potentialMatch = list.items.find(i => !i.checked && i.canonicalName === newItemData.canonicalName);

        if (potentialMatch) {
            if (isMounted) {
                // Found a duplicate, so ask the user. The item stays in the queue.
                setMergeProposal({ existingItem: potentialMatch, newItemData, listId });
            }
            return; // Stop processing until user decides
        }
        
        // No match, so add it.
        _commitItemToList(firestore, listId, list, newItemData);

        if (isMounted) {
            setPendingItemsQueue(prev => prev.slice(1)); // Dequeue successfully added item
        }

      } catch (error) {
        console.error("Error processing item queue:", error);
        toast({ title: 'Processing Error', description: `Could not add "${currentItem.name}".`, variant: 'destructive'});
        if (isMounted) {
          setPendingItemsQueue(prev => prev.slice(1)); // Dequeue failed item
        }
      }
    };
    
    processNextItem();

    return () => {
      isMounted = false;
    }
  }, [pendingItemsQueue, mergeProposal, firestore, toast]);

  const confirmMerge = async () => {
    if (!mergeProposal || !firestore) return;
    const { listId, existingItem, newItemData } = mergeProposal;

    const listRef = doc(firestore, 'lists', listId);
    const listSnap = await getDoc(listRef);

    if (listSnap.exists()) {
      const list = { ...listSnap.data(), id: listSnap.id } as List;
      _performMerge(firestore, listId, list, existingItem, newItemData);
    }
    
    setPendingItemsQueue(prev => prev.slice(1)); // Dequeue handled item
    setMergeProposal(null); // Resume queue processing
  };

  const declineMerge = async (keepSeparate = true) => {
      if (!mergeProposal || !firestore) return;
      const { listId, newItemData } = mergeProposal;
      
      if (keepSeparate) {
        const listRef = doc(firestore, 'lists', listId);
        const listSnap = await getDoc(listRef);
        if (listSnap.exists()) {
          const list = { ...listSnap.data(), id: listSnap.id } as List;
          _commitItemToList(firestore, listId, list, newItemData);
        }
      }
      
      setPendingItemsQueue(prev => prev.slice(1)); // Dequeue handled item
      setMergeProposal(null); // Resume queue processing
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

    const updatedItems = list.items.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );

    updateDocumentNonBlocking(doc(firestore, 'lists', listId), { items: updatedItems });

    toast({ title: "Item Updated", description: `"${updatedItem.name}" has been saved.` });
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
    
    const itemsToQueue = recipe.ingredients.map(ingredient => ({ ...ingredient, listId, skipProcessing: false }));
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
    if (!email) return false;
    
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where("email", "==", email));
    
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'User Not Found', description: 'No user found with that email address.' });
        return false;
      }
      
      const collaborator = querySnapshot.docs[0].data() as UserProfile;
      const entityCollection = entityType === 'list' ? 'lists' : 'recipes';
      
      await updateDocumentNonBlocking(doc(firestore, entityCollection, entityId), {
        collaborators: arrayUnion(collaborator.uid)
      });
      
      toast({ title: 'Collaborator Added', description: `${collaborator.name} can now access this ${entityType}.` });
      return true;

    } catch (error) {
        console.error("Error adding collaborator: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add collaborator.' });
        return false;
    }
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
