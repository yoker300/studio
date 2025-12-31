import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function vibrate() {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}
