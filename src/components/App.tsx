'use client';

import { useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { useIsWatch } from '@/hooks/use-is-watch';
import PhoneExperience from '@/components/phone/PhoneExperience';
import WatchExperience from '@/components/watch/WatchExperience';
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/firebase';
import LoginView from './phone/views/LoginView';

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
      <div className="w-screen h-screen p-4">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (isWatch === undefined || !context) {
    return (
      <div className="w-screen h-screen p-4">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  return isWatch ? <WatchExperience /> : <PhoneExperience />;
}
