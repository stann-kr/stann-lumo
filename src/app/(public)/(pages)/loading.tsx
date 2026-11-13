import PublicPageLoading from '@/components/feature/PublicPageLoading';

/**
 * Streams the loading screen for the list and static pages only. The event and archive detail routes sit outside
 * this group on purpose: under a loading boundary the response is already a streamed 200 when `notFound()` runs,
 * so a missing id would only get a noindex soft 404 instead of a real 404 status.
 */
export default function Loading() {
  return <PublicPageLoading />;
}
