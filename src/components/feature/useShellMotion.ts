'use client';

import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PUBLIC_MOTION, type MotionInput } from './publicMotion';

gsap.registerPlugin(useGSAP);

export function useShellMotion(rootRef: RefObject<HTMLDivElement | null>, pathname: string, isMenuOpen: boolean, input: RefObject<MotionInput>) {
  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const dialog = root.querySelector('[role="dialog"]');
      if (!dialog || !isMenuOpen || input.current === 'keyboard') return;
      const entry = gsap.fromTo(dialog, { y: -8, opacity: 0 }, {
        y: 0, opacity: 1, duration: PUBLIC_MOTION.content, ease: PUBLIC_MOTION.ease,
        clearProps: 'transform,opacity',
      });
      const finish = () => { entry.progress(1); };
      window.addEventListener('keydown', finish, true);
      return () => window.removeEventListener('keydown', finish, true);
    }, rootRef);
    return () => media.revert();
  }, { scope: rootRef, dependencies: [pathname, isMenuOpen], revertOnUpdate: true });
}
