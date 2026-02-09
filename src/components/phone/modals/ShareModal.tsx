'use client';

import { useState, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppContext } from '@/context/AppContext';
import { UserProfile } from '@/lib/types';
import { X, Copy } from 'lucide-react';
import { useUser } from '@/firebase';

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'list' | 'recipe';
  entityId: string;
  ownerId: string;
  collaborators: (UserProfile | undefined)[];
};

export function ShareModal({ isOpen, onClose, entityType, entityId, ownerId, collaborators }: ShareModalProps) {
  const context = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const isOwner = user?.uid === ownerId;

  const handleAddCollaborator = async () => {
    if (!context || !email) return;
    setIsLoading(true);
    const success = await context.addCollaborator(entityType, entityId, email);
    if (success) {
      setEmail('');
    }
    setIsLoading(false);
  };

  const handleRemoveCollaborator = (userId: string) => {
    context?.removeCollaborator(entityType, entityId, userId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this {entityType}</DialogTitle>
          <DialogDescription>
            Invite others to view and edit this {entityType}.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
            <div className="flex w-full max-w-sm items-center space-x-2 my-4">
                <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" onClick={handleAddCollaborator} disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add'}
                </Button>
            </div>
        )}

        <div className="space-y-2">
            <h4 className="font-medium">Collaborators</h4>
            <div className="space-y-2 rounded-md border p-2">
                {collaborators.map(c => c && (
                    <div key={c.uid} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={c.photoURL} alt={c.name} />
                                <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                        </div>
                        {isOwner && c.uid !== ownerId && (
                             <Button variant="ghost" size="icon" onClick={() => handleRemoveCollaborator(c.uid)}>
                                <X className="h-4 w-4 text-destructive" />
                             </Button>
                        )}
                    </div>
                ))}
                {collaborators.length === 0 && <p className="text-sm text-muted-foreground text-center p-2">Just you for now!</p>}
            </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
