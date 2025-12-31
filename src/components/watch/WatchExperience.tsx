'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import WatchHomeView from './views/WatchHomeView';
import WatchListView from './views/WatchListView';

const WatchExperience = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { currentView } = context;

  const renderView = () => {
    if (currentView.type === 'listDetail') {
      return <WatchListView listId={currentView.listId} />;
    }
    // Default to home/list selection
    return <WatchHomeView />;
  };

  return (
    <div className="bg-black text-white min-h-screen w-full font-sans">
      {renderView()}
    </div>
  );
};

export default WatchExperience;
