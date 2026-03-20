/**
 * 어드민 터미널 통합 설정 API
 * GET  /api/admin/terminal-config — URL/설명 + 커스텀 필드 + 스타일 전체 조회
 * PUT  /api/admin/terminal-config — 전체 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { TerminalCustomField, TerminalStyleConfig } from '@/types/content';

interface TerminalConfigRow {
  terminal_url:             string | null;
  terminal_description:     string | null;
  terminal_font_size:       string | null;
  terminal_animation_speed: string | null;
  terminal_prompt_text:     string | null;
  terminal_show_embed:      number | null;
  terminal_embed_height:    string | null;
}

interface CustomFieldRow {
  id: string;
  field_key: string;
  field_value: string;
  field_type: string;
  sort_order: number;
}

export interface TerminalConfigData {
  url:          string;
  description:  string;
  customFields: TerminalCustomField[];
  style:        TerminalStyleConfig;
}

const DEFAULT_STYLE: TerminalStyleConfig = {
  fontSize:       'md',
  animationSpeed: 'normal',
  promptText:     '>',
  showEmbed:      false,
  embedHeight:    '400px',
};

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
    const [configRes, fieldsRes] = await db.batch([
      db.prepare(
        `SELECT terminal_url, terminal_description, terminal_font_size,
                terminal_animation_speed, terminal_prompt_text,
                terminal_show_embed, terminal_embed_height
         FROM site_config WHERE id = 1`,
      ),
      db.prepare('SELECT * FROM terminal_custom_fields ORDER BY sort_order ASC'),
    ]);

    const configRow = (configRes.results[0] as TerminalConfigRow | undefined);
    const fieldRows = (fieldsRes.results as CustomFieldRow[]);

    const customFields: TerminalCustomField[] = fieldRows.map((r) => ({
      id:         r.id,
      fieldKey:   r.field_key,
      fieldValue: r.field_value,
      fieldType:  (r.field_type as TerminalCustomField['fieldType']) ?? 'text',
      sortOrder:  r.sort_order,
    }));

    const style: TerminalStyleConfig = configRow
      ? {
          fontSize:       (configRow.terminal_font_size as TerminalStyleConfig['fontSize'])             ?? 'md',
          animationSpeed: (configRow.terminal_animation_speed as TerminalStyleConfig['animationSpeed']) ?? 'normal',
          promptText:     configRow.terminal_prompt_text  ?? '>',
          showEmbed:      (configRow.terminal_show_embed  ?? 0) === 1,
          embedHeight:    configRow.terminal_embed_height ?? '400px',
        }
      : DEFAULT_STYLE;

    const data: TerminalConfigData = {
      url:         configRow?.terminal_url         ?? '',
      description: configRow?.terminal_description ?? '',
      customFields,
      style,
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch terminal config' } },
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
    const body = (await request.json()) as { config: TerminalConfigData };
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'config is required' } },
        { status: 400 },
      );
    }

    const { url, description, customFields = [], style = DEFAULT_STYLE } = config;

    await db.batch([
      // site_config 터미널 관련 컬럼 업데이트
      db.prepare(
        `UPDATE site_config
         SET terminal_url              = ?,
             terminal_description      = ?,
             terminal_font_size        = ?,
             terminal_animation_speed  = ?,
             terminal_prompt_text      = ?,
             terminal_show_embed       = ?,
             terminal_embed_height     = ?
         WHERE id = 1`,
      ).bind(
        url              || null,
        description      || null,
        style.fontSize,
        style.animationSpeed,
        style.promptText,
        style.showEmbed ? 1 : 0,
        style.embedHeight,
      ),
      // 커스텀 필드 전체 교체
      db.prepare('DELETE FROM terminal_custom_fields'),
      ...customFields.map((field, idx) =>
        db.prepare(
          `INSERT INTO terminal_custom_fields (id, field_key, field_value, field_type, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(field.id, field.fieldKey, field.fieldValue, field.fieldType, idx),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update terminal config' } },
      { status: 500 },
    );
  }
}
