'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Item } from '@/lib/types';
import { ArrowDown } from 'lucide-react';

const ItemDisplay = ({ item }: { item: Partial<Item> }) => (
  <div className="p-3 bg-muted rounded-md text-left w-full">
    <div className="font-bold flex items-center gap-2">
      <span className="text-2xl">{item.icon}</span>
      {item.name}
    </div>
    <div className="text-sm text-muted-foreground pl-8">
      {item.qty} {item.unit}
      {item.store && ` from ${item.store}`}
      {item.notes && ` (${item.notes})`}
    </div>
  </div>
);


export function MergeConfirmationModal() {
  const context = useContext(AppContext);
  if (!context || !context.mergeProposal) return null;

  const { mergeProposal, confirmMerge, declineMerge } = context;
  const { existingItem, newItemData } = mergeProposal;

  return (
    <Dialog open={!!mergeProposal} onOpenChange={(isOpen) => !isOpen && declineMerge(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge These Items?</DialogTitle>
          <DialogDescription>
            You're adding an item that's very similar to one already on your list.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 flex flex-col items-center gap-2">
            <ItemDisplay item={newItemData} />
            <div className="text-muted-foreground font-bold my-1">+</div>
            <ItemDisplay item={existingItem} />
            <ArrowDown className="my-2 text-primary h-6 w-6"/>
            <div className="font-bold text-lg self-start">Combined Result:</div>
            <ItemDisplay item={{
                ...newItemData,
                name: existingItem.name,
                icon: existingItem.icon,
                qty: (existingItem.qty || 0) + (newItemData.qty || 0),
                store: (existingItem.store || newItemData.store || '').trim(),
            }} />
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => declineMerge(true)}>
            Keep Separate
          </Button>
          <Button onClick={confirmMerge}>
            Yes, Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
