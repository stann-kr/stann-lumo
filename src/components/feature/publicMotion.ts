'use client';

import { createContext, useContext, type RefObject } from 'react';

export type MotionInput = 'pointer' | 'keyboard';

export const PublicMotionInputContext = createContext<RefObject<MotionInput> | null>(null);

export function usePublicMotionInput() {
  return useContext(PublicMotionInputContext);
}

export const PUBLIC_MOTION = {
  ease: 'power3.out',
  feedback: 0.16,
  content: 0.24,
  panel: 0.28,
  heading: 0.42,
} as const;
