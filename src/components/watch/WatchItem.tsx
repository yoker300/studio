'use client';

import { useContext } from 'react';
import { Item } from '@/lib/types';
import { AppContext } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { WheatOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type WatchItemProps = {
  item: Item;
  listId: string;
};

const WatchItem = ({ item, listId }: WatchItemProps) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { toggleItemChecked } = context;

  return (
    <div
      onClick={() => toggleItemChecked(listId, item.id)}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg',
        item.checked ? 'bg-gray-800/50 opacity-50' : 'bg-gray-800',
        item.urgent && !item.checked && 'border border-destructive'
      )}
    >
      <span className="text-2xl">{item.icon}</span>
      <div className="flex-1">
        <span className={cn('text-lg', item.checked && 'line-through', item.urgent && !item.checked && 'text-destructive')}>{item.name}</span>
      </div>
      <div className="flex items-center gap-1">
        {item.gf && <WheatOff className="h-4 w-4 text-green-400" />}
        {item.qty > 1 && <Badge className="bg-gray-600 text-white">x{item.qty}</Badge>}
      </div>
    </div>
  );
};

export default WatchItem;
