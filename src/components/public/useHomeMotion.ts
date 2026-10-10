'use client';

import { useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useContentMotion } from '../feature/useContentMotion';
import { PUBLIC_MOTION } from '../feature/publicMotion';

gsap.registerPlugin(useGSAP);

interface PanelSnapshot {
  height: number;
  panels: Array<{ element: HTMLElement; width: number; height: number; wasExpanded: boolean }>;
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
      const isStacked = window.matchMedia('(max-width: 899px)').matches;
      // Read the final layout together, before applying any animation styles.
      const height = group.getBoundingClientRect().height;
      const targets = snapshot.panels.map((panel) => ({
        ...panel,
        bounds: panel.element.getBoundingClientRect(),
        isExpanded: panel.element.dataset.expanded === 'true',
      }));
      const transition = gsap.timeline({ defaults: { duration: PUBLIC_MOTION.panel, ease: PUBLIC_MOTION.ease, autoRound: false } });
      active.current = transition;
      // These four panels must move the actual document flow. Transforming only
      // their borders leaves hit areas and following mobile rows at the destination.
      if (!isStacked) transition.fromTo(group, { height: snapshot.height }, { height, clearProps: 'height' }, 0);
      for (const { element, width, height: previousHeight, bounds, wasExpanded, isExpanded } of targets) {
        transition.set(element, { flex: 'none', overflow: 'clip', minHeight: 0 }, 0);
        transition.fromTo(element, isStacked ? { height: previousHeight } : { width }, {
          ...(isStacked ? { height: bounds.height } : { width: bounds.width }),
          clearProps: 'width,height,flex,minHeight,overflow',
        }, 0);
        if (!isStacked && isExpanded) {
          // Keep text wrapping stable while its containing panel opens.
          const surfaces = element.querySelectorAll('[data-panel-heading], [data-panel-content]');
          transition.set(surfaces, { width: bounds.width }, 0);
          transition.set(surfaces, { clearProps: 'width' }, PUBLIC_MOTION.panel);
        }
        if (wasExpanded !== isExpanded) transition.fromTo(element.querySelector('[data-panel-title]'), {
          opacity: isStacked ? 0.65 : 0,
        }, { opacity: 1, duration: PUBLIC_MOTION.feedback, clearProps: 'opacity' }, isStacked ? 0 : 0.04);
      }
      const content = root.querySelector('[data-expanded="true"] [data-panel-content]');
      if (content) transition.fromTo(content.children, { opacity: 0 }, {
        opacity: 1, duration: PUBLIC_MOTION.feedback, clearProps: 'opacity',
      }, 0.04);
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
      return { element, width: bounds.width, height: bounds.height, wasExpanded: element.dataset.expanded === 'true' };
    });
    active.current?.progress(1);
    pending.current = { height, panels };
  };
}
