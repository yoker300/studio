export type Item = {
  id: string;
  name: string;
  canonicalName?: string;
  category: string;
  qty: number;
  unit?: string;
  urgent: boolean;
  icon: string; // emoji
  store: string;
  notes?: string;
  checked: boolean;
  gf: boolean;
  image?: string;
};

export type Recipe = {
  id: string;
  name: string;
  icon: string; // emoji
  image: string;
  ingredients: Item[];
  ownerId: string;
  collaborators: string[]; // array of user uids
};

export type List = {
  id:string;
  name:string;
  icon: string; // emoji
  items: Item[];
  ownerId: string;
  collaborators: string[]; // array of user uids
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
}

export type SmartQuantity = {
  itemName: string;
  quantities: number[];
};

export type Settings = {
  darkMode: boolean;
  textSize: 'normal' | 'large';
  smartQuantities: SmartQuantity[];
  storePresets: string[];
};

export type View =
  | { type: 'lists' }
  | { type: 'listDetail'; listId: string }
  | { type: 'recipes' }
  | { type: 'recipeDetail'; recipeId: string }
  | { type: 'settings' }
  | { type: 'addList' }
  | { type: 'editList'; listId: string }
  | { type: 'addRecipe' }
  | { type: 'editRecipe'; recipeId?: string };


// AI Flow Types

export type SmartAddItemInput = {
  voiceInput: string;
};
export type SmartAddItemOutput = {
  name: string;
  canonicalName?: string;
  qty?: number;
  category?: string;
  urgent?: boolean;
  icon?: string;
}[];

export type BreakDownRecipeInput = {
  recipeName: string;
};
export type BreakDownRecipeOutput = {
  name: string;
  qty?: number;
  unit?: string;
  notes?: string;
  category?: string;
  urgent?: boolean;
  icon?: string;
}[];

export type GenerateRecipeInput = {
  recipeName: string;
};
export type GenerateRecipeOutput = {
    name: string;
    icon: string;
    ingredients: {
        name: string;
        qty?: number;
        unit?: string;
        notes?: string;
        icon?: string;
    }[];
};

export type ProcessItemInput = {
  name: string;
  qty: number;
  unit?: string;
};
export type ProcessItemOutput = {
  name: string;
  canonicalName: string;
  category: string;
  icon: string;
  qty: number;
  unit?: string;
};

export type ConvertUnitsInput = {
  name: string;
  qty: number;
  unit?: string;
};
export type ConvertUnitsOutput = {
  qty?: number;
  unit?: string;
  error?: string;
};

export type MergeProposal = {
  existingItem: Item;
  newItemData: Omit<Item, 'id' | 'checked'>;
  listId: string;
};
