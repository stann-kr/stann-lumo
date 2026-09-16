'use client';

import { createContext, useContext, type RefObject } from 'react';

export type MotionInput = 'pointer' | 'keyboard';

export const PublicMotionInputContext = createContext<RefObject<MotionInput> | null>(null);

export function usePublicMotionInput() {
  return useContext(PublicMotionInputContext);
}

export const PUBLIC_MOTION = {
  ease: 'power3.out',
  panelEase: 'power3.inOut',
  feedback: 0.22,
  content: 0.48,
  panel: 0.56,
  heading: 0.68,
} as const;
