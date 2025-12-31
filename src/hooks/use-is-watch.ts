'use client';

import * as React from "react"

const WATCH_BREAKPOINT = 300;

export function useIsWatch() {
  const [isWatch, setIsWatch] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkDevice = () => {
      setIsWatch(window.innerWidth < WATCH_BREAKPOINT);
    };

    checkDevice(); // Initial check
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isWatch;
}
