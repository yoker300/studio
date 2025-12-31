'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollMask } from '../ScrollMask';

const WatchHomeView = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { lists, navigate } = context;

  return (
    <div className="pt-8 text-center">
      <h1 className="text-xl font-bold font-headline mb-4">SmartList</h1>
      <ScrollMask>
        {lists.length > 0 ? (
          <div className="flex flex-col gap-2 px-2">
            {lists.map(list => (
              <Button
                key={list.id}
                variant="secondary"
                className="w-full justify-start text-lg h-14"
                onClick={() => navigate({ type: 'listDetail', listId: list.id })}
              >
                <span className="text-2xl mr-3">{list.icon}</span>
                {list.name}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-12">No lists found. Please create a list on your phone.</p>
        )}
      </ScrollMask>
    </div>
  );
};

export default WatchHomeView;
