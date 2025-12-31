'use client';

import { useContext, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppContext } from '@/context/AppContext';
import { Item } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Zap, WheatOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const itemSchema = z.object({
  icon: z.string().min(1, "Icon is required."),
  name: z.string().min(1, 'Item name cannot be empty.'),
  qty: z.number().min(1, 'Quantity must be at least 1.'),
  store: z.string().optional(),
  notes: z.string().optional(),
  urgent: z.boolean(),
  gf: z.boolean(),
});

type ItemFormData = z.infer<typeof itemSchema>;

type ItemEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  listId: string;
};

export function ItemEditModal({ isOpen, onClose, item, listId }: ItemEditModalProps) {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      icon: '🛒',
      name: '',
      qty: 1,
      store: '',
      notes: '',
      urgent: false,
      gf: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        reset({
          icon: item.icon || '🛒',
          name: item.name,
          qty: item.qty,
          store: item.store,
          notes: item.notes,
          urgent: item.urgent,
          gf: item.gf,
        });
      } else {
        reset({
          icon: '🛒',
          name: '',
          qty: 1,
          store: '',
          notes: '',
          urgent: false,
          gf: false,
        });
      }
    }
  }, [item, isOpen, reset]);

  if (!context) return null;
  const { addItemToList, updateItemInList, settings } = context;

  const watchedName = watch('name');
  const watchedQty = watch('qty');
  const watchedUrgent = watch('urgent');
  const watchedGf = watch('gf');
  
  const smartQuantityRule = settings.smartQuantities.find(
    (rule) => watchedName.toLowerCase().includes(rule.itemName.toLowerCase())
  );

  const onSubmit = async (data: ItemFormData) => {
    setIsSubmitting(true);
    const itemData = {
      ...data,
      category: item?.category || '',
      notes: data.notes || '',
      store: data.store || '',
    };
    
    try {
      if (item) { // Editing existing item
        await updateItemInList(listId, { ...item, ...itemData });
        toast({ title: "Item Updated", description: `${data.name} has been updated.`});
      } else { // Adding new item
        await addItemToList(listId, { ...itemData, checked: false });
        toast({ title: "Item Added", description: `${data.name} has been added to your list.`});
      }
      onClose();
    } catch(e) {
      console.error(e)
      toast({ variant: "destructive", title: "Error", description: "Could not save the item."});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{item ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 my-4">
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <Input {...field} className="text-3xl w-16 h-16 p-0 text-center bg-muted" maxLength={2} />
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Item Name" className="text-2xl font-headline font-bold h-16 flex-1" />
              )}
            />
          </div>

          <div className="space-y-4">
            {/* Quantity */}
            <div className="p-3 bg-muted rounded-lg">
              <label className="text-sm font-medium text-muted-foreground">Quantity</label>
              {smartQuantityRule ? (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {smartQuantityRule.quantities.map(q => (
                    <Button key={q} type="button" variant={watchedQty === q ? 'default' : 'outline'} onClick={() => setValue('qty', q)}>{q}</Button>
                  ))}
                  <Input type="number" value={watchedQty} onChange={e => setValue('qty', parseInt(e.target.value) || 1)} className="col-span-1" />
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <Button type="button" size="icon" variant="outline" onClick={() => setValue('qty', Math.max(1, watchedQty - 1))}><Minus className="h-4 w-4" /></Button>
                  <Controller name="qty" control={control} render={({ field }) => <Input {...field} type="number" className="w-20 text-center text-lg" onChange={e => field.onChange(parseInt(e.target.value) || 1)} />} />
                  <Button type="button" size="icon" variant="outline" onClick={() => setValue('qty', watchedQty + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
              )}
            </div>

            {/* Store */}
            <div className="p-3 bg-muted rounded-lg">
                <label className="text-sm font-medium text-muted-foreground">Store</label>
                <Controller name="store" control={control} render={({ field }) => <Input {...field} placeholder="Any Store" className="mt-1 bg-background" />} />
                <div className="flex gap-2 overflow-x-auto mt-2 pb-2">
                  {settings.storePresets.map(preset => (
                    <Button key={preset} type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setValue('store', preset)}>{preset}</Button>
                  ))}
                </div>
            </div>
            
            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={watchedUrgent ? 'destructive' : 'outline'} className="h-16 flex flex-col gap-1" onClick={() => setValue('urgent', !watchedUrgent)}>
                  <Zap/> Urgent
              </Button>
              <Button type="button" variant={watchedGf ? 'secondary' : 'outline'} className={cn("h-16 flex flex-col gap-1", watchedGf && 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300')} onClick={() => setValue('gf', !watchedGf)}>
                  <WheatOff/> Gluten Free
              </Button>
            </div>
            
            {/* Notes */}
            <Controller name="notes" control={control} render={({ field }) => <Textarea {...field} placeholder="Notes (e.g., Brand X, low fat)..." />} />

          </div>

          <DialogFooter className="mt-6 sm:justify-between gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (item ? 'Save Changes' : 'Add Item')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
