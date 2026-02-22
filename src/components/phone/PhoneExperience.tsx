'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import BottomNav from './BottomNav';
import ListsView from './views/ListsView';
import ListDetailView from './views/ListDetailView';
import RecipesView from './views/RecipesView';
import RecipeDetailView from './views/RecipeDetailView';
import SettingsView from './views/SettingsView';
import AddListView from './views/AddListView';
import EditListView from './views/EditListView';
import EditRecipeView from './views/EditRecipeView';
import GenerateRecipeView from './views/GenerateRecipeView';
import { MergeConfirmationModal } from './modals/MergeConfirmationModal';
import GenerateRecipeFromImageView from './views/GenerateRecipeFromImageView';
import GenerateRecipeFromUrlView from './views/GenerateRecipeFromUrlView';

const PhoneExperience = () => {
  const context = useContext(AppContext);

  if (!context) return null;

  const { currentView } = context;

  const renderView = () => {
    switch (currentView.type) {
      case 'lists':
        return <ListsView />;
      case 'listDetail':
        return <ListDetailView listId={currentView.listId} />;
      case 'recipes':
        return <RecipesView />;
      case 'recipeDetail':
        return <RecipeDetailView recipeId={currentView.recipeId} />;
      case 'settings':
        return <SettingsView />;
      case 'addList':
        return <AddListView />;
      case 'editList':
        return <EditListView listId={currentView.listId} />;
      case 'addRecipe':
        return <GenerateRecipeView />;
      case 'addRecipeFromImage':
        return <GenerateRecipeFromImageView />;
      case 'addRecipeFromUrl':
        return <GenerateRecipeFromUrlView />;
      case 'editRecipe':
        return <EditRecipeView recipeId={currentView.recipeId} />;
      default:
        return <ListsView />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderView()}
      </main>
      <MergeConfirmationModal />
      <BottomNav />
    </div>
  );
};

export default PhoneExperience;
