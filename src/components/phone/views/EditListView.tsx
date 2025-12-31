'use client';

import { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

const EMOJI_PRESETS = ['🛒', '🍎', '🎉', '🏠', '💻', '🎁', '🛠️'];

type EditListViewProps = {
  listId: string;
};

const EditListView = ({ listId }: EditListViewProps) => {
  const context = useContext(AppContext);
  const list = context?.lists.find(l => l.id === listId);

  const [name, setName] = useState(list?.name || '');
  const [icon, setIcon] = useState(list?.icon || '🛒');
  

  useEffect(() => {
    if (list) {
      setName(list.name);
      setIcon(list.icon);
    }
  }, [list]);

  if (!context || !list) return null;
  const { updateList, deleteList, navigate } = context;

  const handleUpdateList = () => {
    if (name.trim()) {
      updateList(listId, name, icon);
      navigate({ type: 'listDetail', listId });
    }
  };

  const handleDeleteList = () => {
    deleteList(listId);
  }

  return (
    <div className="p-4">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate({ type: 'listDetail', listId })}>
          <ArrowLeft />
        </Button>
        <h1 className="text-4xl font-headline font-bold">Edit List</h1>
      </header>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Edit "{list.name}"</CardTitle>
          <CardDescription>Update the name and icon for your list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="list-name" className="text-sm font-medium">List Name</label>
            <Input
              id="list-name"
              placeholder="e.g., Weekly Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Icon</label>
            <div className="flex items-center gap-2">
              <div className="text-4xl p-2 bg-muted rounded-lg">{icon}</div>
              <div className="flex-1 grid grid-cols-7 gap-1">
                {EMOJI_PRESETS.map(emoji => (
                  <Button
                    key={emoji}
                    variant={icon === emoji ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setIcon(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the "{list.name}" list and all its items. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteList}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button className="flex-1 ml-4" onClick={handleUpdateList} disabled={!name.trim()}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditListView;
