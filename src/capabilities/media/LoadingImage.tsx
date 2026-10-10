'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LoadingImage.module.css';
import { observeInViewport } from '@/lib/observeInViewport';

type LoadingImageProps = Omit<ComponentProps<'img'>, 'src' | 'onLoad' | 'onError'> & {
  src?: string;
  natural?: boolean;
  /** Decorative thumbnails keep an empty frame instead of an error message that cannot fit. */
  quiet?: boolean;
};

export default function LoadingImage(props: LoadingImageProps) {
  // Changing the source must never reveal the next image with the previous image's ready state.
  return <ImageFrame key={props.src} {...props} />;
}

function ImageFrame({ src, alt = '', className, natural = false, quiet = false, loading = 'lazy', ...props }: LoadingImageProps) {
  const { t } = useTranslation();
  const frameRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [requested, setRequested] = useState(loading === 'eager');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(src ? 'loading' : 'error');

  useEffect(() => {
    if (requested || !src) return;
    const frame = frameRef.current;
    if (!frame) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Browser capability is only known after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRequested(true);
      return;
    }
    const stop = observeInViewport(frame, () => setRequested(true));
    // Keyboard navigation into an item also makes its media available.
    const link = frame.closest('a');
    const onFocus = () => setRequested(true);
    link?.addEventListener('focus', onFocus);
    // A parent layout effect can focus a newly appended item before this subscription exists.
    if (link === document.activeElement) onFocus();
    return () => { stop(); link?.removeEventListener('focus', onFocus); };
  }, [requested, src]);

  useEffect(() => {
    const img = imageRef.current;
    if (!requested || !img || !src) return;
    let cancelled = false;
    let decoding = false;
    const error = () => { if (!cancelled) setState('error'); };
    const ready = async () => {
      if (decoding || cancelled) return;
      if (!img.naturalWidth) { error(); return; }
      decoding = true;
      try {
        if (typeof img.decode === 'function') await img.decode();
        if (!cancelled) setState('ready');
      } catch { error(); }
    };
    img.addEventListener('load', ready);
    img.addEventListener('error', error);
    if (img.complete) void ready();
    return () => { cancelled = true; img.removeEventListener('load', ready); img.removeEventListener('error', error); };
  }, [requested, src]);

  return <span ref={frameRef} className={`${styles.frame} ${natural ? styles.natural : ''} ${className || ''}`} data-load-state={state} aria-busy={state === 'loading'}>
    <img {...props} ref={imageRef} src={requested ? src : undefined} alt={alt} loading="eager" decoding="async" />
    {state !== 'ready' && <span className={styles.placeholder} aria-hidden={state === 'loading' || !alt ? true : undefined}>
      {state === 'error' && !quiet && <span>{t('image_load_error')}</span>}
    </span>}
  </span>;
}
