/**
 * 어드민 사이트 설정 API
 * GET  /api/admin/site-config   — 사이트 설정 + TerminalInfo 조회
 * PUT  /api/admin/site-config   — 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';

interface SiteConfigRow {
  id: number; site_name: string; tagline: string; version: string;
  terminal_url: string | null; terminal_description: string | null;
}

export interface SiteConfigData {
  siteName:            string;
  tagline:             string;
  version:             string;
  terminalUrl:         string;
  terminalDescription: string;
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
    const result = await db.prepare(
      'SELECT * FROM site_config WHERE id = 1',
    ).first<SiteConfigRow>();

    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site config not found' } },
        { status: 404 },
      );
    }

    const data: SiteConfigData = {
      siteName:            result.site_name,
      tagline:             result.tagline,
      version:             result.version,
      terminalUrl:         result.terminal_url         ?? '',
      terminalDescription: result.terminal_description ?? '',
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch site config' } },
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
    const body = (await request.json()) as { siteConfig: SiteConfigData };
    const { siteConfig } = body;

    if (!siteConfig || typeof siteConfig !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'siteConfig is required' } },
        { status: 400 },
      );
    }

    await db.prepare(
      `UPDATE site_config
       SET site_name = ?, tagline = ?, version = ?, terminal_url = ?, terminal_description = ?
       WHERE id = 1`,
    ).bind(
      siteConfig.siteName,
      siteConfig.tagline,
      siteConfig.version,
      siteConfig.terminalUrl         || null,
      siteConfig.terminalDescription || null,
    ).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update site config' } },
      { status: 500 },
    );
  }
}
