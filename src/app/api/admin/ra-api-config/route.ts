/**
 * 어드민 RA API 설정 API
 * GET  /api/admin/ra-api-config  — 설정 조회
 * PUT  /api/admin/ra-api-config  — 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { RAApiConfig } from '@/types/content';

interface RaApiConfigRow {
  id: number;
  user_id: string | null;
  api_key: string | null;
  dj_id: string | null;
  option: string;
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
    const row = await db.prepare('SELECT * FROM ra_api_config WHERE id = 1').first<RaApiConfigRow>();

    const data: RAApiConfig = {
      userId: row?.user_id ?? '',
      apiKey: row?.api_key ?? '',
      djId: row?.dj_id ?? '',
      option: (row?.option ?? '1') as RAApiConfig['option'],
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch RA API config' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const body = (await request.json()) as { raApiConfig: RAApiConfig };
    const { raApiConfig } = body;

    if (!raApiConfig || typeof raApiConfig !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'raApiConfig is required' } },
        { status: 400 },
      );
    }

    await db
      .prepare(
        'UPDATE ra_api_config SET user_id = ?, api_key = ?, dj_id = ?, option = ? WHERE id = 1',
      )
      .bind(
        raApiConfig.userId ?? null,
        raApiConfig.apiKey ?? null,
        raApiConfig.djId ?? null,
        raApiConfig.option ?? '1',
      )
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update RA API config' } },
      { status: 500 },
    );
  }
}
