'use client';

import { useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useContentMotion } from '../feature/useContentMotion';
import { PUBLIC_MOTION } from '../feature/publicMotion';

gsap.registerPlugin(useGSAP);

interface PanelSnapshot {
  height: number;
  panels: Array<{ element: HTMLElement; height: number; surfaceScale: number; wasExpanded: boolean }>;
}

export function useHomeMotion(rootRef: RefObject<HTMLDivElement | null>, selectedPath: string | null, isMotionEnabled: boolean) {
  useContentMotion(rootRef);
  const pending = useRef<PanelSnapshot | null>(null);
  const active = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const finish = () => { active.current?.progress(1); };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-panel-content]')) finish();
    };
    const root = rootRef.current;
    root?.addEventListener('focusin', focus);
    window.addEventListener('keydown', finish, true);
    window.addEventListener('resize', finish);
    document.addEventListener('visibilitychange', finish);
    return () => {
      pending.current = null;
      root?.removeEventListener('focusin', focus);
      window.removeEventListener('keydown', finish, true);
      window.removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', finish);
    };
  }, { scope: rootRef });

  useGSAP(() => {
    const snapshot = pending.current;
    pending.current = null;
    if (!snapshot || !isMotionEnabled || !window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const root = rootRef.current;
      if (!root || document.hidden) return;
      const group = root.querySelector<HTMLElement>('[data-home-panels]');
      if (!group) return;
      // Read the final layout together, before applying any animation styles.
      const height = group.getBoundingClientRect().height;
      const targets = snapshot.panels.map((panel) => ({
        ...panel,
        bounds: panel.element.getBoundingClientRect(),
        isExpanded: panel.element.dataset.expanded === 'true',
      }));
      const transition = gsap.timeline({ defaults: { duration: 0.28, ease: PUBLIC_MOTION.ease, autoRound: false } });
      active.current = transition;
      // Animate the real flow so the next trigger and its hit area move together.
      transition.fromTo(group, { height: snapshot.height }, { height, clearProps: 'height' }, 0);
      for (const { element, height: previousHeight, surfaceScale, bounds, wasExpanded, isExpanded } of targets) {
        // fromTo applies its starting height immediately, before the first tick.
        // Clip at the same time so newly shown content cannot overflow that height.
        transition.fromTo(element, { height: previousHeight, flex: 'none', overflow: 'clip', minHeight: 0 }, {
          height: bounds.height,
          clearProps: 'height,flex,minHeight,overflow',
        }, 0);
        if (wasExpanded !== isExpanded) {
          transition.fromTo(element.querySelector('[data-panel-surface]'), {
            scaleY: surfaceScale,
          }, {
            scaleY: isExpanded ? 1 : 0, duration: 0.2,
            clearProps: 'transform',
          }, 0);
        }
      }
      const content = root.querySelector('[data-expanded="true"] [data-panel-content]');
      if (content) transition.fromTo(content.children, { y: 8, opacity: 0.6 }, {
        y: 0, opacity: 1, duration: 0.2,
        ease: PUBLIC_MOTION.ease, clearProps: 'transform,opacity',
      }, 0);
      return () => { active.current = null; };
    }, rootRef);
    return () => media.revert();
  }, { scope: rootRef, dependencies: [selectedPath, isMotionEnabled], revertOnUpdate: true });

  return (isPointer: boolean) => {
    const root = rootRef.current;
    pending.current = null;
    if (!root || !isPointer || !isMotionEnabled || document.hidden) {
      active.current?.progress(1);
      return;
    }
    const group = root.querySelector<HTMLElement>('[data-home-panels]');
    if (!group) return;
    // Retarget from the drawn sizes, then release the previous context before
    // measuring the next natural layout. No inverse transforms are recaptured.
    const height = group.getBoundingClientRect().height;
    const panels = Array.from(group.querySelectorAll<HTMLElement>('[data-expanded]'), (element) => {
      const bounds = element.getBoundingClientRect();
      const surface = element.querySelector('[data-panel-surface]');
      return {
        element, height: bounds.height,
        surfaceScale: surface ? Number(gsap.getProperty(surface, 'scaleY')) : 0,
        wasExpanded: element.dataset.expanded === 'true',
      };
    });
    active.current?.progress(1);
    pending.current = { height, panels };
  };
}
