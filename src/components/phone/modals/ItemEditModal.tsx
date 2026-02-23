'use client';

import { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppContext } from '@/context/AppContext';
import { Item, List } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Zap, WheatOff, Trash2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const itemSchema = z.object({
  icon: z.string().min(1, "Icon is required."),
  name: z.string().min(1, 'Item name cannot be empty.'),
  qty: z.number().min(0.01, 'Quantity must be greater than 0.'),
  unit: z.string().optional(),
  store: z.string().optional(),
  notes: z.string().optional(),
  urgent: z.boolean(),
  gf: z.boolean(),
  image: z.string().optional(),
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
  const storage = useStorage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const itemId = useMemo(() => item?.id || uuidv4(), [item]);

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
      unit: '',
      store: '',
      notes: '',
      urgent: false,
      gf: false,
      image: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      if (item) {
        reset({
          icon: item.icon || '🛒',
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          store: item.store,
          notes: item.notes,
          urgent: item.urgent,
          gf: item.gf,
          image: item.image,
        });
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else {
        reset({
          icon: '🛒',
          name: '',
          qty: 1,
          unit: '',
          store: '',
          notes: '',
          urgent: false,
          gf: false,
          image: '',
        });
      }
    }
  }, [item, isOpen, reset]);


  if (!context) return null;
  const { addItemToList, updateItemInList, settings, deleteItemInList } = context;

  const watchedName = watch('name');
  const watchedQty = watch('qty');
  const watchedUrgent = watch('urgent');
  const watchedGf = watch('gf');
  const watchedImage = watch('image');
  
  const smartQuantityRule = settings.smartQuantities.find(
    (rule) => watchedName.toLowerCase().includes(rule.itemName.toLowerCase())
  );

  const onSubmit = (data: ItemFormData) => {
    setIsSubmitting(true);
    const itemData = {
      ...data,
      id: itemId, // Ensure ID is consistent
      category: item?.category || '',
      unit: data.unit || '',
      notes: data.notes || '',
      store: data.store || '',
      image: data.image || '',
    };
    
    if (item) {
      updateItemInList(listId, itemData);
    } else {
      addItemToList(listId, { ...itemData, checked: false });
      toast({ title: "Item Added to Queue", description: `"${data.name}" will be processed.`});
    }
    onClose();
  };

  const handleDeleteItem = async () => {
    if (item) {
      if (item.image) {
        try {
          const imageRef = ref(storage, item.image);
          await deleteObject(imageRef);
        } catch (error) {
          console.error("Failed to delete image from storage:", error);
          toast({ variant: 'destructive', title: 'Image Deletion Failed', description: 'Could not remove the old image from storage.'})
        }
      }
      deleteItemInList(listId, item.id);
      toast({ title: "Item Deleted", description: `"${item.name}" has been removed.`});
      onClose();
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    toast({ title: "Uploading image..." });

    // If there's an old image, delete it first.
    if (watchedImage) {
      try {
        const oldImageRef = ref(storage, watchedImage);
        await deleteObject(oldImageRef);
      } catch (error) {
         console.warn("Could not delete old image, it may have already been removed:", error);
      }
    }

    const imageRef = ref(storage, `items/${itemId}/${file.name}`);

    try {
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setValue('image', downloadURL, { shouldValidate: true });
      toast({ title: "Upload complete!" });
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageRemove = async () => {
    if (!watchedImage) return;
    setIsSubmitting(true);
    try {
      const imageRef = ref(storage, watchedImage);
      await deleteObject(imageRef);
      setValue('image', '', { shouldValidate: true });
      toast({ title: "Image removed." });
    } catch (error) {
      console.error("Image removal failed:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove image.' });
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

          <div className="flex items-center gap-2 my-3">
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <Input {...field} className="text-3xl w-14 h-14 p-0 text-center bg-muted" maxLength={2} />
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  ref={nameInputRef}
                  placeholder="Item Name"
                  className="text-2xl font-headline font-bold h-14 flex-1"
                />
              )}
            />
          </div>

          <div className="space-y-3">
            {/* Quantity & Unit */}
            <div className="p-2 bg-muted rounded-lg">
              <label className="text-sm font-bold text-foreground">Quantity</label>
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
                  <Controller name="qty" control={control} render={({ field }) => <Input {...field} type="number" step="0.1" className="w-20 text-center text-lg" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                  <Button type="button" size="icon" variant="outline" onClick={() => setValue('qty', watchedQty + 1)}><Plus className="h-4 w-4" /></Button>
                  <Controller name="unit" control={control} render={({ field }) => <Input {...field} placeholder="Unit (g, ml, cup...)" className="flex-1" />} />
                </div>
              )}
            </div>

            {/* Store */}
            <div className="p-2 bg-muted rounded-lg">
                <label className="text-sm font-bold text-foreground">Store</label>
                <Controller name="store" control={control} render={({ field }) => <Input {...field} placeholder="Any Store" className="mt-1 bg-background" />} />
                <div className="flex gap-2 overflow-x-auto mt-2 pb-2">
                  {settings.storePresets.map(preset => (
                    <Button key={preset} type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setValue('store', preset)}>{preset}</Button>
                  ))}
                </div>
            </div>
            
            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={watchedUrgent ? 'destructive' : 'outline'} className="h-14 flex flex-col gap-1" onClick={() => setValue('urgent', !watchedUrgent)}>
                  <Zap size={20}/> Urgent
              </Button>
              <Button type="button" variant={watchedGf ? 'secondary' : 'outline'} className={cn("h-14 flex flex-col gap-1", watchedGf && 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300')} onClick={() => setValue('gf', !watchedGf)}>
                  <WheatOff size={20}/> Gluten Free
              </Button>
            </div>

            {/* Photo */}
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageInputChange}
                disabled={isSubmitting}
              />
              {watchedImage ? (
                <div className="mt-2 relative">
                  <Image src={watchedImage} alt="Item Preview" width={100} height={100} className="rounded-md w-full h-auto max-h-48 object-contain bg-muted" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={handleImageRemove}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="mt-2 w-full" onClick={handleImageUploadClick} disabled={isSubmitting}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              )}
            </div>

            {/* Notes */}
            <Textarea {...control.register('notes')} placeholder="Notes (e.g., Brand X, low fat)..." rows={2} className="rtl:text-right" />

          </div>

          <DialogFooter className="mt-4 flex justify-between items-center">
            <div>
              {item && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isSubmitting}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This will permanently delete "{item.name}". This action cannot be undone.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteItem}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (item ? 'Save Changes' : 'Add Item')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
