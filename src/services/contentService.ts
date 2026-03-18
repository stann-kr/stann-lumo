/**
 * 공개 콘텐츠 서비스
 *
 * 공개 API(/api/content/[lang])에서 콘텐츠를 가져오는 서비스 계층.
 */

import { apiGet } from './apiClient';
import type { ContentData } from '@/types/content';

/**
 * 지정 언어의 전체 콘텐츠 데이터 조회
 * @param lang  'en' | 'ko'
 * @returns     ContentData | null (DB 미사용 환경 또는 에러 시 null)
 */
export async function fetchContent(lang: 'en' | 'ko'): Promise<ContentData | null> {
  const res = await apiGet<ContentData>(`/api/content/${lang}`);
  if (!res.success || !res.data) return null;
  return res.data;
}
