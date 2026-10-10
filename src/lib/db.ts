/**
 * Cloudflare 런타임 바인딩 접근 헬퍼
 *
 * CF Workers 런타임에서는 getCloudflareContext()로 D1/R2 접근.
 * Node.js 실행은 binding을 만들지 않고 fail-closed 한다. 로컬 데이터가 필요한
 * 개발은 Wrangler local binding을 사용하는 Worker preview로 실행한다.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';

// ── Cloudflare Workers 타입 정의 (@cloudflare/workers-types 미설치 대체) ──────

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface R2Object {
  key: string;
  size: number;
  httpEtag?: string;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}

export interface R2GetOptions {
  /** Conditional headers (If-None-Match …); an unmet condition returns the object without a body. */
  onlyIf?: Headers;
  range?: { offset: number; length: number };
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
}

export interface R2PutOptions {
  httpMetadata?: { contentType?: string; contentDisposition?: string };
  customMetadata?: Record<string, string>;
}

export interface R2Bucket {
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | R2Object | null>;
  head(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob,
    options?: R2PutOptions,
  ): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
}

// ── @opennextjs/cloudflare 전역 CloudflareEnv 인터페이스 확장 ─────────────────
// 로컬 export 대신 global 확장 — getCloudflareContext() 반환 타입과 일치
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
    ADMIN_PASSWORD: string;
    /** 마이그레이션 엔드포인트 활성화 플래그 — 기본 비활성 */
    MIGRATE_ENABLED?: string;
  }
}

// ── CF 런타임 바인딩 접근 ──────────────────────────────────────────────────────

/** CF Workers 런타임 여부 확인 — Node.js 개발환경에서는 throw → null 반환 */
function getRequestCtx() {
  try {
    return getCloudflareContext();
  } catch {
    return null;
  }
}

/**
 * D1 데이터베이스 바인딩 반환
 * - CF Workers 및 Wrangler local preview: 네이티브 D1 바인딩
 * - Node.js: null. 원격 D1 HTTP fallback은 허용하지 않는다.
 */
export function getDB(): D1Database | null {
  const ctx = getRequestCtx();
  if (ctx) return ctx.env.DB;
  return null;
}

/**
 * R2 버킷 바인딩 반환
 * @returns CF Workers 런타임: R2Bucket / Node.js 개발환경: null
 */
export function getR2(): R2Bucket | null {
  return getRequestCtx()?.env.MEDIA ?? null;
}

/**
 * CF 환경변수 접근
 * @returns CF Workers: env vars / Node.js: process.env
 */
export function getEnv(): { ADMIN_PASSWORD: string; MIGRATE_ENABLED?: string } {
  const ctx = getRequestCtx();
  if (ctx) return ctx.env;
  return {
    ADMIN_PASSWORD: (typeof process !== 'undefined' ? process.env.ADMIN_PASSWORD : undefined) ?? '',
    MIGRATE_ENABLED: typeof process !== 'undefined' ? process.env.MIGRATE_ENABLED : undefined,
  };
}
