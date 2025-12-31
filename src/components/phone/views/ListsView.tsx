'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import ListCard from '../cards/ListCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ListsView = () => {
  const context = useContext(AppContext);

  if (!context) return null;

  const { lists, navigate } = context;

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-4xl font-headline font-bold">Your Lists</h1>
      </header>
      
      {lists.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">You don't have any lists yet.</p>
          <Button onClick={() => navigate({ type: 'addList' })}>
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}

      <div className="fixed bottom-24 right-4">
         <Button
            size="icon"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => navigate({ type: 'addList' })}
          >
            <Plus className="h-6 w-6" />
          </Button>
      </div>
    </div>
  );
};

export default ListsView;
