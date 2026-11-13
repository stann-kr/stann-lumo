import { permanentRedirect } from 'next/navigation';

/** About was folded into the press kit (2026-11): old links and search results land there with a 308. */
export default function AboutPage(): never {
  permanentRedirect('/press-kit');
}
