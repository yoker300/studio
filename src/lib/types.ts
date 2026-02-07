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
};

export type Recipe = {
  id: string;
  name: string;
  icon: string; // emoji
  image: string;
  ingredients: Item[];
  collaborators?: string[];
};

export type List = {
  id:string;
  name:string;
  icon: string; // emoji
  items: Item[];
  collaborators?: string[];
};

export type SmartQuantity = {
  itemName: string;
  quantities: number[];
};

export type Settings = {
  darkMode: boolean;
  textSize: 'normal' | 'large';
  username: string;
  email: string;
  smartQuantities: SmartQuantity[];
  storePresets: string[];
  mergeBehavior: 'strict' | 'smart';
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
};
export type ProcessItemOutput = {
  name: string;
  canonicalName: string;
  category: string;
  icon: string;
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
