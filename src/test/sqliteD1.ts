import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { D1Database, D1PreparedStatement, D1Result } from '@/lib/db';

class SqliteStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(
    private readonly sqlite: DatabaseSync,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const row = this.sqlite.prepare(this.sql).get(...this.values as never[]) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (colName ? row[colName] : row) as T;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    return this.execute<T>();
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return this.execute<T>();
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    return this.sqlite.prepare(this.sql).all(...this.values as never[]) as T[];
  }

  execute<T = unknown>(): D1Result<T> {
    const statement = this.sqlite.prepare(this.sql);
    if (/^\s*(SELECT|WITH|PRAGMA)/i.test(this.sql) || /\bRETURNING\b/i.test(this.sql)) {
      return {
        results: statement.all(...this.values as never[]) as T[],
        success: true,
        meta: { changes: 0 },
      };
    }
    const result = statement.run(...this.values as never[]);
    return {
      results: [],
      success: true,
      meta: { changes: Number(result.changes) },
    };
  }
}

export function createSqliteD1(): { db: D1Database; sqlite: DatabaseSync; close: () => void } {
  const sqlite = new DatabaseSync(':memory:');
  for (const migration of ['0001_schema.sql', '0002_ra_sync_operations.sql', '0003_track_media.sql']) {
    sqlite.exec(readFileSync(resolve(process.cwd(), 'migrations', migration), 'utf8'));
  }

  const db: D1Database = {
    prepare(sql) {
      return new SqliteStatement(sqlite, sql);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map((statement) => {
          if (!(statement instanceof SqliteStatement)) {
            throw new Error('SQLite test adapter only accepts its own statements');
          }
          return statement.execute();
        });
        sqlite.exec('COMMIT');
        return results as D1Result<T>[];
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    async exec(sql) {
      sqlite.exec(sql);
      return { count: 0, duration: 0 };
    },
  };

  return { db, sqlite, close: () => sqlite.close() };
}
