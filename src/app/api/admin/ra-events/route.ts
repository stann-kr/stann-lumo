/**
 * RA 이벤트 프록시 API
 * GET /api/admin/ra-events
 *
 * 브라우저에서 RA API를 직접 호출하면 CORS 차단됨.
 * 이 라우트가 서버(CF Workers)에서 RA API를 호출하고 XML을 그대로 반환.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';

interface RaApiConfigRow {
  user_id: string | null;
  api_key: string | null;
  dj_id: string | null;
  option: string;
  year: string | null;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const row = await db
      .prepare('SELECT user_id, api_key, dj_id, option, year FROM ra_api_config WHERE id = 1')
      .first<RaApiConfigRow>();

    if (!row?.user_id || !row?.api_key || !row?.dj_id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'RA API 설정이 완료되지 않았습니다.' } },
        { status: 400 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const reqOption = searchParams.get('option');
    const reqYear = searchParams.get('year');

    const option = reqOption || row.option || '1';
    let year = reqYear !== null ? reqYear : row.year;
    
    // 만약 year가 비어있고, Option이 4(최근) 혹은 3이라면 기본값으로 올해 연도를 채웁니다.
    if (!year && option === '4') {
      year = new Date().getFullYear().toString();
    }

    const params = new URLSearchParams({
      AccessKey: row.api_key,
      UserID: row.user_id,
      DJID: row.dj_id,
      Option: option,
      VenueID: '',
      CountryID: '',
      AreaID: '',
      PromoterID: '',
      Year: year || '',
    });

    const raResponse = await fetch(
      `https://www.residentadvisor.net/api/events.asmx/GetEvents?${params.toString()}`,
      { headers: { Accept: 'application/xml, text/xml' } },
    );

    if (!raResponse.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'RA_API_ERROR', message: `RA API 오류: ${raResponse.status}` } },
        { status: 502 },
      );
    }

    const xml = await raResponse.text();

    return new Response(xml, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'RA API 호출 실패',
        },
      },
      { status: 500 },
    );
  }
}
