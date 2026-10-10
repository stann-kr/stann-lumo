import { NextResponse } from 'next/server';
import { getEventsPage } from '@/capabilities/content/publicContent.server';
import { publicPageOffset } from '@/capabilities/content/publicPagination';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const offset = publicPageOffset(params.get('offset'));
  const section = params.get('section');
  const today = params.get('today') || '';
  if (offset === null || (section !== 'upcoming' && section !== 'past') || !/^\d{4}-\d{2}-\d{2}$/.test(today) || !Number.isFinite(Date.parse(today))) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  try {
    return NextResponse.json({ success: true, data: await getEventsPage(section, today, offset) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
