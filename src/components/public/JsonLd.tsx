import { serializeJsonLd } from '@/capabilities/site/structuredData';

/** Renders schema.org data for search engines; it has no visible output. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
