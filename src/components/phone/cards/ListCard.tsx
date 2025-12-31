'use client';

import { useContext } from 'react';
import { List } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { AppContext } from '@/context/AppContext';

type ListCardProps = {
  list: List;
};

const ListCard = ({ list }: ListCardProps) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { navigate } = context;
  const totalItems = list.items.length;
  const checkedItems = list.items.filter(item => item.checked).length;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate({ type: 'listDetail', listId: list.id })}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-3 text-2xl font-headline">
          <span className="text-4xl">{list.icon}</span>
          {list.name}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate({type: 'editList', listId: list.id}); }}>
          <Pencil className="h-5 w-5" />
        </Button>
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
