'use client';

import { useState, useContext, useMemo } from 'react';
import { AppContext } from '@/context/AppContext';
import { Item } from '@/lib/types';
import ItemRow from '../cards/ItemCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Zap, ZapOff, Sparkles, Plus, Share2 } from 'lucide-react';
import { ItemEditModal } from '../modals/ItemEditModal';
import { SmartAddModal } from '../modals/SmartAddModal';
import { ShareModal } from '../modals/ShareModal';
import { useUser } from '@/firebase';

type ListDetailViewProps = {
  listId: string;
};

const ListDetailView = ({ listId }: ListDetailViewProps) => {
  const context = useContext(AppContext);
  const [editingItem, setEditingItem] = useState<Item | null | 'new'>(null);
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  
  const { user } = useUser();
  const list = context?.lists.find(l => l.id === listId);

  const groupedItems = useMemo(() => {
    if (!list) return {};
    
    let itemsToDisplay = list.items;
    if (context?.urgentMode) {
      itemsToDisplay = list.items.filter(item => item.urgent && !item.checked);
    }

    const grouped: { [key: string]: Item[] } = itemsToDisplay.reduce((acc, item) => {
      const key = item.checked ? 'Checked' : item.category || 'Other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as { [key: string]: Item[] });

    // Sort categories, with 'Checked' at the end
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Checked') return 1;
      if (b === 'Checked') return -1;
      return a.localeCompare(b);
    });

    const sortedGroupedItems: { [key: string]: Item[] } = {};
    for (const category of sortedCategories) {
      sortedGroupedItems[category] = grouped[category];
    }

    return sortedGroupedItems;

  }, [list, context?.urgentMode]);


  if (!context || !list) return (
    <div className="p-4">
      <Button variant="ghost" size="icon" className="mr-2" onClick={() => context?.navigate({ type: 'lists' })}>
          <ArrowLeft />
      </Button>
      List not found.
    </div>
  );

  const { navigate, urgentMode, setUrgentMode, users } = context;
  const isOwner = user?.uid === list.ownerId;
  const collaborators = list.collaborators.map(uid => users.find(u => u.uid === uid)).filter(Boolean);

  return (
    <>
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10 p-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ type: 'lists' })}>
          <ArrowLeft />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-headline font-bold truncate">{list.icon} {list.name}</h1>
          <p className="text-sm text-muted-foreground">{list.items.filter(i => !i.checked).length} items remaining</p>
        </div>
        {isOwner && (
          <Button variant="ghost" size="icon" onClick={() => setShareModalOpen(true)}>
            <Share2 className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => navigate({ type: 'editList', listId })}>
          <Pencil className="h-5 w-5" />
        </Button>
        <Button variant={urgentMode ? "destructive" : "ghost"} size="icon" onClick={() => setUrgentMode(!urgentMode)}>
          {urgentMode ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {urgentMode ? "No urgent items." : "This list is empty. Add an item!"}
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-headline font-semibold mb-2 pb-1 border-b-2 border-primary/30">{category}</h2>
              <div className="space-y-2">
                {items.map(item => (
                  <ItemRow key={item.id} item={item} listId={listId} onEdit={() => setEditingItem(item)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-24 right-4 flex flex-col gap-3">
         <Button
            size="icon"
            variant="secondary"
            className="rounded-full h-14 w-14 shadow-lg bg-accent hover:bg-accent/90"
            onClick={() => setShowSmartAdd(true)}
          >
            <Sparkles className="h-6 w-6" />
          </Button>
         <Button
            size="icon"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => setEditingItem('new')}
          >
            <Plus className="h-6 w-6" />
          </Button>
      </div>
      
      <ItemEditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem === 'new' ? null : editingItem}
        listId={listId}
      />
      <SmartAddModal
        isOpen={showSmartAdd}
        onClose={() => setShowSmartAdd(false)}
        listId={listId}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        entityType="list"
        entityId={listId}
        ownerId={list.ownerId}
        collaborators={collaborators}
      />
    </>
  );
};

export default ListDetailView;
