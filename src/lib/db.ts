/**
 * Cloudflare 런타임 바인딩 접근 헬퍼
 *
 * CF Workers 런타임에서는 getCloudflareContext()로 D1/R2 접근.
 * Docker 개발 환경(Node.js)에서는 Cloudflare D1 REST API HTTP 어댑터로 실제 DB 직접 쿼리.
 *   필요 환경변수: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (docker-compose.yml에 이미 선언)
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

// ── @opennextjs/cloudflare 전역 CloudflareEnv 인터페이스 확장 ─────────────────
// 로컬 export 대신 global 확장 — getCloudflareContext() 반환 타입과 일치
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
    ADMIN_PASSWORD: string;
  }
}

// ── D1 HTTP 어댑터 (로컬 개발 환경) ──────────────────────────────────────────
// Cloudflare D1 REST API를 통해 실제 DB를 직접 쿼리 — wrangler.json database_id 참조

const D1_DATABASE_ID = '9ef2f5b5-e0f2-4bb0-98e2-b3b1ba39917e';

interface D1HttpQueryResponse<T> {
  result: Array<{ results: T[]; success: boolean; meta: Record<string, unknown> }>;
  success: boolean;
  errors: Array<{ message: string }>;
}

class D1HttpPreparedStatement implements D1PreparedStatement {
  constructor(
    private readonly db: D1HttpAdapter,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new D1HttpPreparedStatement(this.db, this.sql, values);
  }

  async _execute<T>(): Promise<D1Result<T>> {
    return this.db._query<T>(this.sql, this.params);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const result = await this._execute<Record<string, unknown>>();
    if (!result.results.length) return null;
    if (colName !== undefined) return (result.results[0][colName] ?? null) as T | null;
    return result.results[0] as unknown as T;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    return this._execute<T>();
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return this._execute<T>();
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const result = await this._execute<Record<string, unknown>>();
    return result.results.map((r) => Object.values(r)) as T[];
  }
}

class D1HttpAdapter implements D1Database {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(accountId: string, apiToken: string) {
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${D1_DATABASE_ID}/query`;
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  async _query<T>(sql: string, params: unknown[] = []): Promise<D1Result<T>> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ sql, params }),
    });
    if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json() as D1HttpQueryResponse<T>;
    if (!data.success) throw new Error(`D1 query failed: ${data.errors[0]?.message ?? 'unknown'}`);
    return data.result[0] ?? { results: [], success: true, meta: {} };
  }

  prepare(query: string): D1PreparedStatement {
    return new D1HttpPreparedStatement(this, query);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return Promise.all(
      statements.map((s) => (s as D1HttpPreparedStatement)._execute<T>()),
    );
  }

  async exec(query: string): Promise<{ count: number; duration: number }> {
    await this._query(query);
    return { count: 0, duration: 0 };
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
 * - CF Workers 런타임: 네이티브 D1 바인딩
 * - Node.js 로컬 개발: Cloudflare D1 REST API HTTP 어댑터 (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN 필요)
 */
export function getDB(): D1Database | null {
  const ctx = getRequestCtx();
  if (ctx) return ctx.env.DB;

  const accountId = typeof process !== 'undefined' ? process.env.CLOUDFLARE_ACCOUNT_ID : undefined;
  const apiToken  = typeof process !== 'undefined' ? process.env.CLOUDFLARE_API_TOKEN  : undefined;
  if (accountId && apiToken) return new D1HttpAdapter(accountId, apiToken);

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
export function getEnv(): { ADMIN_PASSWORD: string } {
  const ctx = getRequestCtx();
  if (ctx) return ctx.env;
  return {
    ADMIN_PASSWORD: (typeof process !== 'undefined' ? process.env.ADMIN_PASSWORD : undefined) ?? '',
  };
}
