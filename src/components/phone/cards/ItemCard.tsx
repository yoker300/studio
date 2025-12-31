'use client';

import { useContext } from 'react';
import { Item } from '@/lib/types';
import { AppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WheatOff } from 'lucide-react';

type ItemRowProps = {
  item: Item;
  listId: string;
  onEdit: () => void;
};

const ItemRow = ({ item, listId, onEdit }: ItemRowProps) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { toggleItemChecked } = context;

  return (
    <Card
      onClick={onEdit}
      className={cn(
        'transition-all duration-300',
        item.checked ? 'bg-muted/50 opacity-60' : 'bg-card',
        item.urgent && !item.checked && 'border-destructive'
      )}
    >
      <CardContent className="p-3 flex items-start gap-3">
        <Checkbox
          id={`item-${item.id}`}
          checked={item.checked}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => toggleItemChecked(listId, item.id)}
          className="mt-1 h-6 w-6 rounded-full"
        />
        <div className="flex-1 grid gap-1" onClick={onEdit}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{item.icon}</span>
            <span
              className={cn(
                'font-medium',
                item.checked && 'line-through',
                item.urgent && !item.checked && 'text-destructive font-bold'
              )}
            >
              {item.name}
            </span>
            {item.qty > 1 && (
              <Badge variant="secondary">x{item.qty}</Badge>
            )}
             {item.gf && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <WheatOff className="h-3 w-3 mr-1" /> GF
              </Badge>
            )}
          </div>
          {(item.store || item.notes) && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              {item.store && <Badge variant="outline">{item.store}</Badge>}
              {item.notes && <p className="text-blue-600 dark:text-blue-400">{item.notes}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemRow;
