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
import { Trash2, Pencil, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SmartQuantity } from '@/lib/types';
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

const SettingsView = () => {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const [newStore, setNewStore] = useState('');
  
  // State for adding new smart quantity
  const [newSQItemName, setNewSQItemName] = useState('');
  const [newSQQuantities, setNewSQQuantities] = useState('');

  // State for editing a smart quantity
  const [editingSQ, setEditingSQ] = useState<SmartQuantity | null>(null);
  const [editingSQName, setEditingSQName] = useState('');
  const [editingSQQuantities, setEditingSQQuantities] = useState('');

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

  const startEditingSQ = (sq: SmartQuantity) => {
    setEditingSQ(sq);
    setEditingSQName(sq.itemName);
    setEditingSQQuantities(sq.quantities.join(', '));
  }

  const cancelEditingSQ = () => {
    setEditingSQ(null);
    setEditingSQName('');
    setEditingSQQuantities('');
  }

  const handleSQUpdate = () => {
    if (!editingSQ) return;

    const quantities = editingSQQuantities.split(',').map(q => parseInt(q.trim())).filter(q => !isNaN(q) && q > 0);
     if (quantities.length === 0) {
        toast({ variant: 'destructive', title: 'Invalid Quantities', description: 'Please provide a comma-separated list of numbers.' });
        return;
    }

    const updatedSQ = { itemName: editingSQName, quantities };
    updateSettings({ 
        smartQuantities: settings.smartQuantities.map(sq => sq.itemName === editingSQ.itemName ? updatedSQ : sq) 
    });
    cancelEditingSQ();
  };

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

      {/* Smart Quantities Card */}
       <Card>
        <CardHeader>
          <CardTitle>Smart Quantities</CardTitle>
          <CardDescription>Manage pre-defined quantities for common items.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                {settings.smartQuantities.map(sq => (
                    <div key={sq.itemName}>
                        {editingSQ?.itemName === sq.itemName ? (
                            <div className="flex items-center justify-between p-2 bg-muted rounded-md gap-2">
                                <div className="flex-1 space-y-1">
                                    <Input value={editingSQName} onChange={e => setEditingSQName(e.target.value)} placeholder="Item Name"/>
                                    <Input value={editingSQQuantities} onChange={e => setEditingSQQuantities(e.target.value)} placeholder="e.g. 1, 6, 12"/>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleSQUpdate}><Save className="h-4 w-4 text-green-600" /></Button>
                                <Button variant="ghost" size="icon" onClick={cancelEditingSQ}><X className="h-4 w-4" /></Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <div>
                                    <span className="font-medium">{sq.itemName}</span>
                                    <span className="text-sm text-muted-foreground ml-2">({sq.quantities.join(', ')})</span>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => startEditingSQ(sq)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will delete the smart quantity rule for "{sq.itemName}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleSQRemove(sq.itemName)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Add New Rule</h4>
                <div className="flex gap-2">
                    <Input placeholder="Item Name (e.g. 'Milk')" value={newSQItemName} onChange={e => setNewSQItemName(e.target.value)} />
                    <Input placeholder="Quantities (e.g. 1, 2, 4)" value={newSQQuantities} onChange={e => setNewSQQuantities(e.target.value)} />
                    <Button onClick={handleSQAdd}>Add</Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsView;
