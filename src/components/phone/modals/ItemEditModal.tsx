'use client';

import { useContext, useEffect, useState, useRef, useMemo } from 'react';
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
import { ref, deleteObject } from 'firebase/storage';
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
  image: z.string().optional(), // This will hold the existing image URL
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
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      icon: '🛒', name: '', qty: 1, unit: '', store: '', notes: '',
      urgent: false, gf: false, image: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      if (item) {
        reset({
          icon: item.icon || '🛒', name: item.name, qty: item.qty, unit: item.unit,
          store: item.store, notes: item.notes, urgent: item.urgent, gf: item.gf, image: item.image,
        });
        setImagePreview(item.image || null);
      } else {
        reset({
          icon: '🛒', name: '', qty: 1, unit: '', store: '', notes: '',
          urgent: false, gf: false, image: '',
        });
        setImagePreview(null);
      }
      setImageFile(null); // Always clear staged file
    }
  }, [item, isOpen, reset]);

  // Clean up blob URL
  useEffect(() => {
    return () => {
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
    };
  }, [imagePreview]);


  if (!context) return null;
  const { addItemToList, updateItemInList, settings, deleteItemInList, uploadItemImageInBackground } = context;

  const watchedName = watch('name');
  const watchedQty = watch('qty');
  const watchedUrgent = watch('urgent');
  const watchedGf = watch('gf');
  
  const smartQuantityRule = settings.smartQuantities.find(
    (rule) => watchedName.toLowerCase().includes(rule.itemName.toLowerCase())
  );

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const MAX_DIMENSION = 800;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    return reject(new Error('Failed to get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob failed'));
                    }
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(newFile);
                }, 'image/jpeg', 0.8); // 80% quality
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const onSubmit = (data: ItemFormData) => {
    setIsSaving(true);
    const finalItemId = item?.id || itemId;

    // Determine if an existing image was removed by the user
    const imageWasRemoved = !!(item?.image && !imagePreview);

    // Prepare the main item data for an immediate save.
    // The image URL will be updated later by the background task if a new one is being uploaded.
    const itemData: Item = {
        ...data,
        id: finalItemId,
        category: item?.category || '',
        checked: item?.checked || false,
        image: imageWasRemoved ? '' : (item?.image || ''),
    };

    // Immediately save the text-based data.
    if (item) {
        updateItemInList(listId, itemData);
    } else {
        addItemToList(listId, itemData);
    }

    // --- Handle Background Tasks ---

    // 1. If a new file was selected, start the background upload.
    if (imageFile) {
        uploadItemImageInBackground(listId, finalItemId, imageFile, item?.image);
    } 
    // 2. If an existing image was removed (and no new one was added), delete it from storage.
    else if (imageWasRemoved && item?.image) {
        const oldImageRef = ref(storage, item.image);
        deleteObject(oldImageRef).catch((err: any) => {
            console.error("Failed to delete old image from storage", err);
            toast({ variant: 'destructive', title: "Image Cleanup Failed", description: `Could not remove the old image file. Reason: ${err.code || 'Unknown'}` });
        });
    }

    onClose(); // Close the modal immediately.
  };

  const handleDeleteItem = async () => {
    if (item) {
      // The deleteItemInList function in context already handles deleting the storage object.
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

    if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
    }

    toast({ title: "Compressing image..." });

    try {
        const compressedFile = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedFile);
        setImagePreview(previewUrl);
        setImageFile(compressedFile);
        toast({ title: "Image ready for upload!" });
    } catch (error) {
        console.error("Image compression failed:", error);
        toast({
            variant: "destructive",
            title: "Compression Failed",
            description: "Could not compress the image. The original file will be used.",
        });
        // Fallback to original file
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setImageFile(file);
    }
  };

  const handleImageRemove = () => {
    // Just update the UI state. `onSubmit` will handle the actual deletion.
    if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-md p-4"
      >
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
              />
              {imagePreview ? (
                <div className="mt-2 relative">
                  <Image src={imagePreview} alt="Item Preview" width={100} height={100} className="rounded-md w-full h-auto max-h-48 object-contain bg-muted" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={handleImageRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="mt-2 w-full" onClick={handleImageUploadClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              )}
            </div>

            {/* Notes */}
            <Textarea {...control.register('notes')} placeholder="Notes (e.g., Brand X, low fat)..." rows={2} className="rtl:text-right" />

          </div>

          <DialogFooter className="mt-4 flex flex-row justify-between items-center">
            <div>
              {item && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isSaving}>
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
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : (item ? 'Save Changes' : 'Add Item')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
