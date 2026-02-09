'use client';

import { useContext } from 'react';
import { List, UserProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { AppContext } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';

type ListCardProps = {
  list: List;
};

const ListCard = ({ list }: ListCardProps) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { user } = useUser();
  const { navigate, users } = context;
  const totalItems = list.items.length;
  const checkedItems = list.items.filter(item => item.checked).length;
  
  const owner = users.find(u => u.uid === list.ownerId);
  const isOwner = user?.uid === list.ownerId;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate({ type: 'listDetail', listId: list.id })}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
          <CardTitle className="flex items-center gap-3 text-2xl font-headline">
            <span className="text-4xl">{list.icon}</span>
            {list.name}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {owner && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={owner.photoURL} alt={owner.name} />
                <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            {list.collaborators.map(uid => {
              if (uid === list.ownerId) return null; // Don't show owner's avatar twice
              const collaborator = users.find(u => u.uid === uid);
              if (!collaborator) return null;
              return (
                <Avatar key={uid} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={collaborator.photoURL} alt={collaborator.name} />
                  <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        </div>
        {isOwner && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate({type: 'editList', listId: list.id}); }}>
            <Pencil className="h-5 w-5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {totalItems > 0 ? `${checkedItems} of ${totalItems} items checked` : 'No items yet'}
        </div>
        {totalItems > 0 && (
          <div className="w-full bg-muted rounded-full h-2.5 mt-2">
            <div
              className="bg-primary h-2.5 rounded-full transition-all"
              style={{ width: `${(checkedItems / totalItems) * 100}%` }}
            ></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListCard;
