'use client';

import { useContext } from 'react';
import { List, UtensilsCrossed, Settings } from 'lucide-react';
import { AppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { activeTab, navigate } = context;

  const navItems = [
    { name: 'lists', icon: List, label: 'Lists', color: 'text-primary' },
    { name: 'recipes', icon: UtensilsCrossed, label: 'Recipes', color: 'text-primary' },
    { name: 'settings', icon: Settings, label: 'Settings', color: 'text-primary' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => navigate({ type: item.name })}
              className={cn(
                'flex flex-col items-center justify-center p-3 w-24 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
                isActive && `bg-accent/50 ${item.color} font-semibold`
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
