'use client';

import { useContext } from 'react';
import { Item } from '@/lib/types';
import { AppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WheatOff, Pencil, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ItemRowProps = {
  item: Item;
  listId: string;
  onEdit: () => void;
};

const ItemRow = ({ item, listId, onEdit }: ItemRowProps) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { toggleItemChecked } = context;
  const combinedNotes = [item.unit, item.store, item.notes].filter(Boolean).join(', ');

  return (
    <Card
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
          className="mt-1 h-6 w-6"
        />
        <div className="flex-1 grid gap-1">
          <div className="flex items-center gap-2 flex-wrap">
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
              <Badge variant="outline">
                <WheatOff className="h-3 w-3 mr-1" /> GF
              </Badge>
            )}
            {item.image && (
                <Camera className="h-4 w-4 text-muted-foreground" />
             )}
          </div>
          {combinedNotes && (
            <div className="text-sm text-muted-foreground pl-8">
              <p>{combinedNotes}</p>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-5 w-5 text-muted-foreground" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ItemRow;
