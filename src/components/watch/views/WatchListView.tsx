'use client';

import { useContext, useMemo } from 'react';
import { AppContext } from '@/context/AppContext';
import { Item } from '@/lib/types';
import WatchItem from '../WatchItem';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, ZapOff } from 'lucide-react';
import { ScrollMask } from '../ScrollMask';

type WatchListViewProps = {
  listId: string;
};

const WatchListView = ({ listId }: WatchListViewProps) => {
  const context = useContext(AppContext);
  const list = context?.lists.find(l => l.id === listId);

  const groupedItems = useMemo(() => {
    if (!list) return {};
    
    let itemsToDisplay = list.items;
    if (context?.urgentMode) {
      itemsToDisplay = list.items.filter(item => item.urgent && !item.checked);
    }
    
    const grouped = itemsToDisplay.reduce((acc, item) => {
      const key = item.checked ? 'Checked' : item.category || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as { [key: string]: Item[] });

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Checked') return 1; if (b === 'Checked') return -1;
      return a.localeCompare(b);
    });

    const sortedGroupedItems: { [key: string]: Item[] } = {};
    sortedCategories.forEach(category => {
      sortedGroupedItems[category] = grouped[category];
    });
    return sortedGroupedItems;
  }, [list, context?.urgentMode]);

  if (!context || !list) return null;

  const { navigate, urgentMode, setUrgentMode } = context;

  return (
    <div className="flex flex-col h-screen">
       <header className="pt-8 px-2 flex items-center justify-between">
         <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate({ type: 'lists' })}>
            <ArrowLeft className="h-6 w-6" />
         </Button>
         <h1 className="text-lg font-bold font-headline truncate flex-1 text-center">{list.icon} {list.name}</h1>
         <div className="w-10 h-10"/> {/* Spacer */}
       </header>

      <ScrollMask className="flex-1 my-2">
         {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {urgentMode ? "No urgent items." : "List is empty or all items are checked."}
          </div>
        ) : (
          <div className="space-y-4 px-2">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-md font-semibold text-primary/80 mb-1">{category}</h2>
                <div className="space-y-1">
                  {items.map(item => (
                    <WatchItem key={item.id} item={item} listId={listId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollMask>

      <div className="p-2 border-t border-gray-800">
        <Button 
          className="w-full h-12 text-lg" 
          variant={urgentMode ? "destructive" : "secondary"}
          onClick={() => setUrgentMode(!urgentMode)}
        >
          {urgentMode ? <ZapOff className="mr-2" /> : <Zap className="mr-2" />}
          Urgent
        </Button>
      </div>
    </div>
  );
};

export default WatchListView;
