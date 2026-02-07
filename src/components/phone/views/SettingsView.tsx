'use client';

import { useContext, useState } from 'react';
import { AppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SettingsView = () => {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [newStore, setNewStore] = useState('');
  
  const [newSQItemName, setNewSQItemName] = useState('');
  const [newSQQuantities, setNewSQQuantities] = useState('');


  if (!context) return null;
  const { settings, updateSettings } = context;

  const handleStoreAdd = () => {
    if (newStore && !settings.storePresets.includes(newStore)) {
      updateSettings({ storePresets: [...settings.storePresets, newStore] });
      setNewStore('');
    }
  };

  const handleStoreRemove = (storeToRemove: string) => {
    updateSettings({ storePresets: settings.storePresets.filter(s => s !== storeToRemove) });
  };
  
  const handleProfileSave = () => {
    toast({ title: 'Profile Saved!', description: 'Your profile details have been updated.' });
  }

  const handleSQAdd = () => {
    if (!newSQItemName || !newSQQuantities) {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide both an item name and quantities.' });
        return;
    }
    const quantities = newSQQuantities.split(',').map(q => parseInt(q.trim())).filter(q => !isNaN(q) && q > 0);
    if (quantities.length === 0) {
        toast({ variant: 'destructive', title: 'Invalid Quantities', description: 'Please provide a comma-separated list of numbers.' });
        return;
    }

    const newSQ = { itemName: newSQItemName, quantities };
    updateSettings({ smartQuantities: [...settings.smartQuantities, newSQ] });
    setNewSQItemName('');
    setNewSQQuantities('');
  };

  const handleSQRemove = (itemName: string) => {
    updateSettings({ smartQuantities: settings.smartQuantities.filter(sq => sq.itemName !== itemName) });
  };

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-4xl font-headline font-bold">Settings</h1>
      </header>
      
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={settings.username} onChange={e => updateSettings({ username: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={settings.email} onChange={e => updateSettings({ email: e.target.value })} />
          </div>
          <Button onClick={handleProfileSave}>Save Profile</Button>
        </CardContent>
      </Card>

      {/* Presets Card */}
      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
          <CardDescription>Manage your predefined stores and smart quantities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Store Presets</h3>
              <div className="flex gap-2">
                <Input placeholder="New store name" value={newStore} onChange={e => setNewStore(e.target.value)} />
                <Button onClick={handleStoreAdd}><Plus className="h-4 w-4 mr-2"/> Add</Button>
              </div>
              <div className="space-y-2 mt-2">
                {settings.storePresets.map(store => (
                  <div key={store} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span>{store}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleStoreRemove(store)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
               <h3 className="font-medium mb-2">Smart Quantities</h3>
                <div className="space-y-2">
                    {settings.smartQuantities.map(sq => (
                         <div key={sq.itemName} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div>
                                <span className="font-medium">{sq.itemName}</span>
                                <span className="text-sm text-muted-foreground ml-2">({sq.quantities.join(', ')})</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleSQRemove(sq.itemName)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <div className="flex gap-2 mt-2">
                    <Input placeholder="Item Name (e.g. 'Milk')" value={newSQItemName} onChange={e => setNewSQItemName(e.target.value)} />
                    <Input placeholder="Quantities (e.g. 1, 2, 4)" value={newSQQuantities} onChange={e => setNewSQQuantities(e.target.value)} />
                    <Button onClick={handleSQAdd}><Plus className="h-4 w-4 mr-2"/> Add</Button>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Appearance & Behavior Card */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance & Behavior</CardTitle>
          <CardDescription>Customize the look, feel, and functionality of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="text-size">Text Size</Label>
            <Select
              value={settings.textSize}
              onValueChange={(value: 'normal' | 'large') => updateSettings({ textSize: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default SettingsView;
