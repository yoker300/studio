'use client';

import { useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { useIsWatch } from '@/hooks/use-is-watch';
import PhoneExperience from '@/components/phone/PhoneExperience';
import WatchExperience from '@/components/watch/WatchExperience';
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/firebase';
import LoginView from './phone/views/LoginView';
import Image from 'next/image';

export default function App() {
  const isWatch = useIsWatch();
  const context = useContext(AppContext);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (context && context.settings) {
      document.body.classList.toggle('dark', context.settings.darkMode);
      document.body.classList.toggle('text-lg', context.settings.textSize === 'large');
      document.body.classList.toggle('urgent-mode', context.urgentMode);
    }
  }, [context?.settings?.darkMode, context?.settings?.textSize, context?.urgentMode]);

  if (isUserLoading || context?.isDataLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background p-4">
        <Image
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080"
          alt="SmartList Loading"
          width={200}
          height={200}
          className="rounded-3xl shadow-2xl animate-pulse"
          priority
          data-ai-hint="groceries fresh"
        />
        <h1 className="text-4xl font-headline font-bold mt-6">SmartList</h1>
        <p className="text-muted-foreground mt-2">Loading your lists...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (isWatch === undefined || !context) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background p-4">
        <Image
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080"
          alt="SmartList Loading"
          width={200}
          height={200}
          className="rounded-3xl shadow-2xl animate-pulse"
          priority
          data-ai-hint="groceries fresh"
        />
        <h1 className="text-4xl font-headline font-bold mt-6">SmartList</h1>
        <p className="text-muted-foreground mt-2">Loading your lists...</p>
      </div>
    );
  }

  return isWatch ? <WatchExperience /> : <PhoneExperience />;
}
