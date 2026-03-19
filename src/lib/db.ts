/**
 * Cloudflare 런타임 바인딩 접근 헬퍼
 *
 * CF Workers 런타임에서는 getRequestContext()로 D1/R2 접근.
 * Docker 개발 환경(Node.js)에서는 getRequestContext()가 throw → null 반환 폴백.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare Workers 타입 정의 (@cloudflare/workers-types 미설치 시 대체)
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
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
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
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob,
    options?: R2PutOptions,
  ): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
}

export interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  ADMIN_PASSWORD: string;
}

/** CF Workers 런타임 여부 확인 — Node.js 개발환경에서는 throw → null 반환 */
function getRequestCtx(): { env: CloudflareEnv } | null {
  try {
    return getCloudflareContext() as { env: CloudflareEnv };
  } catch {
    return null;
  }
}

/**
 * D1 데이터베이스 바인딩 반환
 * @returns CF Workers 런타임: D1Database / Node.js 개발환경: null
 */
export function getDB(): D1Database | null {
  return getRequestCtx()?.env.DB ?? null;
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
export function getEnv(): Pick<CloudflareEnv, 'ADMIN_PASSWORD'> {
  const ctx = getRequestCtx();
  if (ctx) return ctx.env;
  return {
    // Next.js 서버 환경에서는 process.env 사용
    ADMIN_PASSWORD: (typeof process !== 'undefined' ? process.env.ADMIN_PASSWORD : undefined) ?? '',
  };
}
