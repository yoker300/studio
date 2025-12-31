'use client';

import { useState, useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const EMOJI_PRESETS = ['🛒', '🍎', '🎉', '🏠', '💻', '🎁', '🛠️'];

const AddListView = () => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🛒');
  const context = useContext(AppContext);

  if (!context) return null;
  const { addList, navigate } = context;

  const handleAddList = () => {
    if (name.trim()) {
      addList(name, icon);
    }
  };

  return (
    <div className="p-4">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate({ type: 'lists' })}>
          <ArrowLeft />
        </Button>
        <h1 className="text-4xl font-headline font-bold">New List</h1>
      </header>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create a List</CardTitle>
          <CardDescription>Give your new shopping list a name and an icon.</CardDescription>
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
        <CardFooter>
          <Button className="w-full" onClick={handleAddList} disabled={!name.trim()}>
            Create List
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddListView;
