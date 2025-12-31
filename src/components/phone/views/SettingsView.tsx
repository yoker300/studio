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
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SettingsView = () => {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [newStore, setNewStore] = useState('');

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
    // In a real app, this would hit an API
    toast({ title: "Profile Saved!", description: "Your profile details have been updated." });
  }

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-4xl font-headline font-bold">Settings</h1>
      </header>

      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

      {/* Store Presets Card */}
      <Card>
        <CardHeader>
          <CardTitle>Store Presets</CardTitle>
          <CardDescription>Manage your favorite stores for quick selection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="New store name" value={newStore} onChange={e => setNewStore(e.target.value)} />
            <Button onClick={handleStoreAdd}>Add</Button>
          </div>
          <div className="space-y-2">
            {settings.storePresets.map(store => (
              <div key={store} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <span>{store}</span>
                <Button variant="ghost" size="icon" onClick={() => handleStoreRemove(store)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Quantities Card - View Only for now */}
       <Card>
        <CardHeader>
          <CardTitle>Smart Quantities</CardTitle>
          <CardDescription>Pre-defined quantities for common items. This feature is managed automatically.</CardDescription>
        </CardHeader>
        <CardContent>
           <ul className="space-y-1 text-sm text-muted-foreground">
             {settings.smartQuantities.map(sq => (
                <li key={sq.itemName}>
                  <strong>{sq.itemName}:</strong> {sq.quantities.join(', ')}
                </li>
             ))}
           </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsView;
