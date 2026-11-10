/**
 * 사이트 기본 설정 상수
 * - 환경변수 우선, 없으면 기본값 사용
 * - Phase 4에서 D1 site_config 테이블로 대체 예정
 */
export const SITE_NAME = 'STANN LUMO';
export const SITE_TAGLINE = 'TECHNO / SEOUL';
export const SITE_VERSION = 'v1.0.0';
export const TERMINAL_URL = process.env.NEXT_PUBLIC_TERMINAL_URL || 'https://terminal.stann.kr';
export const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || 'https://stann.kr';

/** Public artist profiles and contact from the official press kit (2026-11). */
export const CONTACT_EMAIL = 'contact@stann.kr';
export const INSTAGRAM_URL = 'https://www.instagram.com/stannlumo/';
export const SOUNDCLOUD_URL = 'https://soundcloud.com/stannlumo';
